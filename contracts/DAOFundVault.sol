//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./common/AccessibleCommon.sol";

//import "hardhat/console.sol";

contract DAOFundVault is AccessibleCommon {
    using SafeERC20 for IERC20;

    IERC20 public doc;
    string public name;

    constructor(address _doc, string memory _name) {
        require(_doc != address(0), "SimpleVault: zero address");
        doc = IERC20(_doc);
        name = _name;
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    function claim(address to, uint256 amount) external onlyOwner {
        require(doc.balanceOf(address(this)) >= amount,"SimpleVault: insufficent");
        doc.safeTransfer(to, amount);
    }

}
