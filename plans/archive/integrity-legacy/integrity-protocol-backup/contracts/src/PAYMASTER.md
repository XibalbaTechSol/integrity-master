# StablecoinVaultPaymaster: ERC-4337 Gas Abstraction & MEV Protection
## Technical Architecture & Integration Guide

---

## 1. Executive Summary
The **StablecoinVaultPaymaster** is an ERC-4337 compliant smart contract that enables autonomous AI agents and users to execute transactions on Base L2 using stablecoins (e.g., USDC) instead of native ETH. 

By abstracting gas fees into stable assets, the contract removes the friction of maintaining native gas balances across hundreds of isolated agent accounts. Simultaneously, it captures transaction-level value to drive programmatic buy-pressure for the protocol, utilizing a secure, **Asynchronous MEV-Protected Fee Collection** model.

---

## 2. Core Economic Design

### 2.1. Dynamic Gas Sponsorship
Standard ERC-4337 requires the EntryPoint to verify that either the Smart Account or a sponsoring Paymaster has sufficient native ETH to cover the maximum possible gas cost of a transaction (`requiredPreFund`). 

The `StablecoinVaultPaymaster` sponsors this ETH fee from its own on-chain balance and recovers the equivalent amount in stablecoins from the calling Smart Account through a two-phase process:

```
[Agent Smart Account]                       [StablecoinVaultPaymaster]
          |                                             |
          | ---- 1. pre-fund (maxTokenCost) ----------> | (validatePaymasterUserOp)
          |                                             |
          | <--- 2. refund (max - actualTokenCost) ---- | (_postOp after execution)
          v                                             v
```

1.  **Validation Phase (`_validatePaymasterUserOp`):**
    *   Calculates the maximum stablecoin fee required based on the EntryPoint's pre-funded ETH threshold and the current price feed:
        $$\text{maxTokenCost} = \frac{\text{requiredPreFund} \times \text{tokenPrice}}{10^{18}}$$
    *   Directly pulls this `maxTokenCost` from the agent's Smart Account using `safeTransferFrom`.
    *   Encodes the sender and `maxTokenCost` into the execution context.

2.  **Post-Execution Phase (`_postOp`):**
    *   Receives the `actualGasCost` from the EntryPoint.
    *   Calculates the precise stablecoin fee used by the transaction:
        $$\text{actualTokenCost} = \frac{\text{actualGasCost} \times \text{tokenPrice}}{10^{18}}$$
    *   Refunds the difference (`maxTokenCost - actualTokenCost`) back to the agent's Smart Account.
    *   Appends the `actualTokenCost` to the `accumulatedVault`.

---

### 2.2. Asynchronous MEV Protection (Mitigation #1)
If a Paymaster immediately swapped incoming stablecoin fees for utility tokens on a decentralized exchange (DEX) synchronously within the transaction, the transaction would be highly vulnerable to **mempool sandwich attacks**. MEV searchers would observe the pending transaction, front-run the swap, and siphoned the value.

To eliminate this vulnerability, the `StablecoinVaultPaymaster` implements **Asynchronous Pooling**:
*   The contract retains stablecoins in its internal vault and increments the `accumulatedVault` balance.
*   An authorized off-chain **Keeper** (a continuous monitoring bot) watches the accumulated balance.
*   Once the accumulated value reaches a threshold where it is highly gas-profitable (`collected fees >> swap gas cost`), the Keeper triggers `triggerBatchedSwap()`.
*   The actual buyback and burn is executed over a private mempool RPC (like Flashbots Protect) using Time-Weighted Average Price (TWAP) routing.

---

## 3. Storage & API Reference

### 3.1. Key Storage Variables
*   `token` (`IERC20`): Address of the accepted stablecoin (e.g. USDC).
*   `accumulatedVault` (`uint256`): Total accrued fees currently held in the vault awaiting asynchronous conversion.
*   `tokenPrice` (`uint256`): Number of stablecoins equivalent to 1 ETH, adjusted for decimals (e.g. $3000 \times 10^6$ for USDC's 6 decimals).
*   `isKeeper` (`mapping(address => bool)`): Access control list of authorized off-chain bots permitted to trigger the vault swap.

### 3.2. Public/External Methods

#### `validatePaymasterUserOp`
Called by the EntryPoint to verify that the Paymaster agrees to pay for the UserOperation. It pulls the maximum stablecoin fee from the user account.
```solidity
function validatePaymasterUserOp(
    PackedUserOperation calldata userOp,
    bytes32 userOpHash,
    uint256 maxCost
) external returns (bytes memory context, uint256 validationData);
```

#### `postOp`
Called by the EntryPoint after transaction execution to refund unused stablecoins and update the internal vault balance.
```solidity
function postOp(
    PostOpMode mode,
    bytes calldata context,
    uint256 actualGasCost,
    uint256 actualUserOpFeePerGas
) external;
```

#### `triggerBatchedSwap`
Resets the `accumulatedVault` to 0 and emits an event. Can only be invoked by an authorized Keeper or the Contract Owner.
```solidity
function triggerBatchedSwap() external onlyKeeper;
```

#### `setTokenPrice`
Updates the conversion price feed. Can only be called by the Owner.
```solidity
function setTokenPrice(uint256 _tokenPrice) external onlyOwner;
```

#### `updateKeeper`
Authorizes or deauthorizes a Keeper address. Can only be called by the Owner.
```solidity
function updateKeeper(address keeper, bool status) external onlyOwner;
```

---

## 4. Test Suite Reference (`StablecoinVaultPaymaster.t.sol`)

Our Foundry test suite simulates real-world ERC-4337 runtime execution:

1.  **`testPaymasterInitialization`:** Verifies the correct contract parameters, ownership models, and keeper state initializations.
2.  **`testSponsorUserOperation`:** Simulates a complete ERC-4337 loop. Generates a mock UserOperation signed by an agent, passes it to the `EntryPoint`, checks that the transaction executed successfully, verifies that the agent's smart account was billed the correct amount of USDC, and checks that the `accumulatedVault` was successfully incremented by the actual gas cost.
3.  **`testAsynchronousKeeperSwap`:** Direct validation of our MEV mitigation pattern. Pranks the `EntryPoint` to execute `postOp`, verifies the `accumulatedVault` accrues fees, pranks the authorized Keeper to trigger the batch swap, and verifies the vault is securely reset.
4.  **`testUnauthorizedKeeperRejection`:** Enforces access control security, ensuring that un-registered or malicious addresses attempting to trigger batch swaps are immediately reverted with `"Not authorized keeper"`.
