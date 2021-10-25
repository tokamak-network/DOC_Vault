//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../common/AccessibleCommon.sol";

import "hardhat/console.sol";

contract DesignedVault is AccessibleCommon {
    using SafeERC20 for IERC20;

    uint256 public maxInputOnceTime;

    string public name;

    IERC20 public doc;

    bool public diffClaimCheck;
    bool public tgeCheck;

    uint256 public firstClaimAmount;
    uint256 public firstClaimTime;

    uint256 public totalAllocatedAmount;
    uint256 public totalClaimedAmount;

    uint256 public startTime;
    uint256 public endTime;
    uint256 public claimPeriodTimes;        //클레임 기간 시간
    uint256 public claimCounts;             //몇번 클레임 했는지

    uint256 public tgeAmount;               //입력 tgeAmount 해야하는 양
    uint256 public tgeTime;                 //tge를 하는 시간

    uint256 public totalClaims;
    uint256 public totalTgeCount;
    uint256 public totalTgeAmount;          //실제 tgeAmount

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
        address _doc,
        uint256 _inputMaxOnce
    ) {
        name = _name;
        doc = _doc;
        maxInputOnceTime = _inputMaxOnce;
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    ///@dev initialization function
    ///@param _totalAllocatedAmount total allocated amount
    ///@param _totalClaims total available claim count
    ///@param _startTime start time             //클레임 시작 시간 (11월 30일 무시, tge무시)
    ///@param _periodTimesPerClaim period time per claim
    function initialize(
        uint256 _totalAllocatedAmount,
        uint256 _totalClaims,
        uint256 _startTime,
        uint256 _periodTimesPerClaim
    ) external onlyOwner {
        totalAllocatedAmount = _totalAllocatedAmount;
        totalClaims = _totalClaims;
        startTime = _startTime;
        claimPeriodTimes = _periodTimesPerClaim;
    }

    function diffSetting(
        uint256[2] calldata _tgeAmount,
        uint256[2] calldata _diffFistClaim
    ) 
        external
        onlyOwner
    {
        tgeSetting(
            _tgeAmount[0],
            _tgeAmount[1]
        );
        diffFirstClaimSetting(
            _diffFistClaim[0],
            _diffFistClaim[1]
        );
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
    
    function tgeClaim(address _account)        
        external
        onlyOwner
    {   
        require(block.timestamp > tgeTime, "Designed Valut: need the tgeTime");
        require(doc.balanceOf(address(this)) >= tgeAmount && totalAllocatedAmount >= tgeAmount, "Designed Valut: check the amount");
        totalTgeAmount = totalTgeAmount + tgeAmount;
        doc.safeTransfer(_account, tgeAmount);
    }

    function Claim(address _account)
        external
        onlyOwner
    {

    }

}
