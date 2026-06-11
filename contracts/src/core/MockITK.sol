// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockITK
 * @dev Mock Integrity Token ($ITK) for testnet and local development.
 */
contract MockITK is ERC20, Ownable {
    constructor() ERC20("Integrity Token", "ITK") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
