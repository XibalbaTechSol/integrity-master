// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {BasePaymaster} from "@account-abstraction/contracts/core/BasePaymaster.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {PostOpMode} from "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract StablecoinVaultPaymaster is BasePaymaster {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    
    // Accumulates the fees asynchronously
    uint256 public accumulatedVault;
    uint256 public tokenPrice;

    mapping(address => bool) public isKeeper;

    event BatchSwapTriggered(uint256 amount);
    event KeeperUpdated(address indexed keeper, bool status);
    event TokenPriceUpdated(uint256 newPrice);

    modifier onlyKeeper() {
        require(isKeeper[msg.sender] || msg.sender == owner(), "Not authorized keeper");
        _;
    }

    constructor(
        IEntryPoint _entryPoint,
        IERC20 _token
    ) BasePaymaster(_entryPoint) {
        token = _token;
    }

    function updateKeeper(address keeper, bool status) external onlyOwner {
        isKeeper[keeper] = status;
        emit KeeperUpdated(keeper, status);
    }

    function setTokenPrice(uint256 _tokenPrice) external onlyOwner {
        tokenPrice = _tokenPrice;
        emit TokenPriceUpdated(_tokenPrice);
    }

    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 /* userOpHash */,
        uint256 requiredPreFund
    ) internal override returns (bytes memory context, uint256 validationData) {
        // Calculate the maximum cost in tokens
        uint256 maxTokenCost = (requiredPreFund * tokenPrice) / 1e18; 

        // Pull the max token cost upfront from the sender
        token.safeTransferFrom(userOp.sender, address(this), maxTokenCost);

        // Context contains sender and max cost to be used in postOp
        context = abi.encode(userOp.sender, maxTokenCost);
        validationData = 0;
    }

    function _postOp(
        PostOpMode /* mode */,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 /* actualUserOpFeePerGas */
    ) internal override {
        (address sender, uint256 maxTokenCost) = abi.decode(context, (address, uint256));

        uint256 actualTokenCost = (actualGasCost * tokenPrice) / 1e18;
        
        // Refund the difference if actual cost is less than max cost
        if (maxTokenCost > actualTokenCost) {
            uint256 refund = maxTokenCost - actualTokenCost;
            token.safeTransfer(sender, refund);
        }

        // Asynchronous MEV mitigation: Accumulate fees instead of swapping synchronously
        accumulatedVault += actualTokenCost;
    }

    function triggerBatchedSwap() external onlyKeeper {
        uint256 amountToSwap = accumulatedVault;
        require(amountToSwap > 0, "No accumulated fees");
        
        accumulatedVault = 0;
        
        emit BatchSwapTriggered(amountToSwap);
    }
}
