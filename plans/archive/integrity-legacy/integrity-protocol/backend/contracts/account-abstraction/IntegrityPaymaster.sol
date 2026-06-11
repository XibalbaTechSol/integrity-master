// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Self-contained ERC-4337 minimal Interfaces to ensure immediate compilation.
 */
struct UserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 callGasLimit;
    uint256 verificationGasLimit;
    uint256 preVerificationGas;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
    bytes paymasterAndData;
    bytes signature;
}

enum PostOpMode {
    opSucceeded,
    opReverted,
    postOpReverted
}

interface IPaymaster {
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external returns (bytes memory context, uint256 validationData);

    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) external;
}

interface IEntryPoint {
    function depositTo(address account) external payable;
    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external;
    function getSenderAddress(bytes calldata initCode) external;
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata params) external returns (uint256 amountOut);
}

/**
 * @title IntegrityPaymaster
 * @notice Standard ERC-4337 paymaster that accepts USDC from agents, swaps a portion to ITK, and burns it.
 */
contract IntegrityPaymaster is IPaymaster {
    address public immutable entryPoint;
    IERC20 public immutable usdcToken;
    IERC20 public immutable itkToken;
    ISwapRouter public immutable swapRouter;
    address public immutable treasury;

    uint256 public constant BURN_PERCENTAGE = 50; // 50% of USDC fee swapped and burned
    uint256 public constant VALID_SIGNATURE_PERIOD = 0; // 0 indicates signature validation succeeded

    event FeeCharged(address indexed sender, uint256 usdcAmount, uint256 itkBurned);

    constructor(
        address _entryPoint,
        address _usdcToken,
        address _itkToken,
        address _swapRouter,
        address _treasury
    ) {
        require(_entryPoint != address(0), "Invalid EntryPoint");
        require(_usdcToken != address(0), "Invalid USDC");
        require(_itkToken != address(0), "Invalid ITK");
        require(_swapRouter != address(0), "Invalid Router");
        require(_treasury != address(0), "Invalid Treasury");

        entryPoint = _entryPoint;
        usdcToken = IERC20(_usdcToken);
        itkToken = IERC20(_itkToken);
        swapRouter = ISwapRouter(_swapRouter);
        treasury = _treasury;
    }

    /**
     * @notice Validates paymaster user operation, charging USDC from the sender upfront.
     */
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 /* userOpHash */,
        uint256 maxCost
    ) external override returns (bytes memory context, uint256 validationData) {
        require(msg.sender == entryPoint, "Paymaster: caller must be EntryPoint");

        // The userOp.sender must have approved this Paymaster to spend USDC
        require(usdcToken.transferFrom(userOp.sender, address(this), maxCost), "Paymaster: USDC charge failed");

        return (abi.encode(userOp.sender, maxCost), VALID_SIGNATURE_PERIOD);
    }

    /**
     * @notice Performs post-operation swap-and-burn of the collected fees.
     */
    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) external override {
        require(msg.sender == entryPoint, "Paymaster: caller must be EntryPoint");
        (address sender, uint256 maxCostCharged) = abi.decode(context, (address, uint256));

        // Calculate actual amount of USDC spent based on gas consumed
        uint256 usdcSpent = actualGasCost; // Direct representation for mapping

        if (usdcSpent > maxCostCharged) {
            usdcSpent = maxCostCharged;
        }

        // Refund the extra USDC to the sender if they overpaid maxCost
        if (maxCostCharged > usdcSpent) {
            uint256 refundAmount = maxCostCharged - usdcSpent;
            usdcToken.transfer(sender, refundAmount);
        }

        if (mode == PostOpMode.opSucceeded && usdcSpent > 0) {
            uint256 burnAllocation = (usdcSpent * BURN_PERCENTAGE) / 100;
            uint256 treasuryAllocation = usdcSpent - burnAllocation;

            uint256 itkBurned = 0;

            // Perform Uniswap V3 swap and burn if swap allocation is non-zero
            if (burnAllocation > 0) {
                usdcToken.approve(address(swapRouter), burnAllocation);
                
                try swapRouter.exactInputSingle(
                    ISwapRouter.ExactInputSingleParams({
                        tokenIn: address(usdcToken),
                        tokenOut: address(itkToken),
                        fee: 3000,
                        recipient: address(this),
                        deadline: block.timestamp + 300,
                        amountIn: burnAllocation,
                        amountOutMinimum: 0,
                        sqrtPriceLimitX96: 0
                    })
                ) returns (uint256 amountOut) {
                    itkBurned = amountOut;
                    // Burn the purchased ITK (send to zero address)
                    itkToken.transfer(address(0), itkBurned);
                } catch {
                    // Fallback in case swap fails: transfer entire fee to treasury to prevent transaction halt
                    treasuryAllocation += burnAllocation;
                }
            }

            // Transfer the rest of the USDC to the treasury
            if (treasuryAllocation > 0) {
                usdcToken.transfer(treasury, treasuryAllocation);
            }

            emit FeeCharged(sender, usdcSpent, itkBurned);
        }
    }
}
