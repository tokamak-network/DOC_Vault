//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../common/AccessibleCommon.sol";

import "hardhat/console.sol";

contract DesignedVault is AccessibleCommon {
    using SafeERC20 for IERC20;

    string public name;

    IERC20 public doc;

    bool public diffClaimCheck;
    bool public tgeCheck;

    uint256 public firstClaimAmount = 0;     //처음클레임이 다른경우 클레임양
    uint256 public firstClaimTime;          //처음클레임이 다른경우 시간

    uint256 public totalAllocatedAmount;    //컨트랙트에서 지급되어야하는 Amount

    uint256 public startTime;               //클레임 시작시간
    uint256 public claimPeriodTimes;        //클레임 간격 시간
    uint256 public totalClaimCounts;        //총 클레임 횟수 (36)

    uint256 public nowClaimRound = 0;       //현재 클레임한 라운드

    uint256 public tgeAmount;               //입력 tgeAmount 해야하는 양
    uint256 public tgeTime;                 //tge를 하는 시간

    uint256 public totalClaimsAmount;           //실제로 지급한 claimAmount
    uint256 public totalTgeAmount = 0;          //실제로 지급한 tgeAmount

    modifier nonZeroAddress(address _addr) {
        require(_addr != address(0), "DesignedVault: zero address");
        _;
    }

    modifier nonZero(uint256 _value) {
        require(_value > 0, "DesignedVault: zero value");
        _;
    }

    ///@dev constructor
    ///@param _name Vault's name
    ///@param _doc Allocated tos address
    constructor(
        string memory _name,
        address _doc
    ) {
        name = _name;
        doc = IERC20(_doc);
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    ///@dev initialization function
    ///@param _totalAllocatedAmount total allocated amount
    ///@param _totalClaims total available claim count
    ///@param _startTime start time             //클레임 시작 시간 (11월 30일 무시, tge무시, 12월 5일 오후 5시)
    ///@param _periodTimesPerClaim period time per claim
    function initialize(
        uint256 _totalAllocatedAmount,
        uint256 _totalClaims,
        uint256 _startTime,
        uint256 _periodTimesPerClaim
    ) external onlyOwner {
        totalAllocatedAmount = _totalAllocatedAmount;
        totalClaimCounts = _totalClaims;
        startTime = _startTime;
        claimPeriodTimes = _periodTimesPerClaim;
    }

    function diffSetting(
        uint256[2] calldata _tgeAmount,
        bool _diffFisrt,
        uint256[2] calldata _diffFistClaim
    ) 
        external
        onlyOwner
    {
        tgeSetting(
            _tgeAmount[0],
            _tgeAmount[1]
        );
        if(_diffFisrt){
            diffFirstClaimSetting(
                _diffFistClaim[0],
                _diffFistClaim[1]
            );
        }
    }

    function tgeSetting(
        uint256 _amount,
        uint256 _time
    )
        public
        onlyOwner
    {
        tgeAmount = _amount;
        tgeTime = _time;
    }

    function diffFirstClaimSetting(uint256 _amount, uint256 _time)
        public
        onlyOwner
        nonZero(_amount)
    {
        diffClaimCheck = true;
        firstClaimAmount = _amount;
        firstClaimTime = _time;
    }

    function currentRound() public view returns (uint256 round) {
        if(diffClaimCheck) {
            if (block.timestamp < firstClaimTime) {
                round = 0;
            } else if(firstClaimTime < block.timestamp && block.timestamp < startTime) {
                round = 1;
            } else {
                round = (block.timestamp - startTime) / claimPeriodTimes;
                round = round + 2;
            }
        } else {
            if (block.timestamp < startTime) {
                round = 0;
            } else {
                round = (block.timestamp - startTime) / claimPeriodTimes;
                round++;
            }
        }
    }

    function calcalClaimAmount(uint256 _round) public view returns (uint256 amount) {
        uint256 remainAmount;
        if(diffClaimCheck && _round == 1) {
            amount = firstClaimAmount;
        } else if(diffClaimCheck){
            remainAmount = totalAllocatedAmount - totalTgeAmount - firstClaimAmount;
            amount = remainAmount/(totalClaimCounts-1);
        } else {
            remainAmount = totalAllocatedAmount - totalTgeAmount;
            amount = remainAmount/totalClaimCounts;
        }
    }
    
    function tgeClaim(address _account)        
        external
        onlyOwner
    {   
        require(block.timestamp > tgeTime, "Designed Valut: need the tgeTime");
        require(doc.balanceOf(address(this)) >= tgeAmount && totalTgeAmount == 0, "Designed Valut: already claim tge");
        totalTgeAmount = totalTgeAmount + tgeAmount;
        doc.safeTransfer(_account, tgeAmount);
    }

    function claim(address _account)
        external
        onlyOwner
    {
        uint256 count = 0;
        uint256 time;

        if(diffClaimCheck){
            time = firstClaimTime;
        } else {
            time = startTime;
        }

        require(block.timestamp > time, "DesignedVault: not started yet");

        uint256 curRound = currentRound();

        uint256 amount = calcalClaimAmount(curRound);

        if(curRound != 1 && diffClaimCheck && totalClaimsAmount < firstClaimAmount) {
            count = curRound - nowClaimRound;
            amount = (amount * (count-1)) + firstClaimAmount;
        } else {
            count = curRound - nowClaimRound;
            amount = (amount * count);
        }
        
        nowClaimRound = curRound;
        totalClaimsAmount = totalClaimsAmount + amount;
        doc.safeTransfer(_account, tgeAmount);

    }

}
