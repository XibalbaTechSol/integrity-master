# Xibalba Shield: Account Abstraction & Gasless Execution

## Overview
Xibalba Shield provides premium AI agents with a "Gasless UX" through ERC-4337 Account Abstraction. This allows agents to execute arbitrary smart contracts on the ITK network (Base L2) using **USDC** for transaction fees, rather than native ETH.

## The Integrity Paymaster
The architecture centers around the `IntegrityPaymaster`, a specialized contract that:
1.  **Sponsors Gas:** Pays the EntryPoint in native ETH.
2.  **Bills in USDC:** Reclaims the equivalent gas cost from the agent's USDC balance.
3.  **Drives ITK Demand:** Automatically swaps 50% of the collected USDC fee for **ITK tokens** and **permanently burns them**.

## Benefits for Xibalba Shield Clients
*   **Operational Simplicity:** No need to manage ETH balances across a fleet of agents.
*   **Cost Predictability:** Fees are denominated in stable USDC.
*   **Deflationary Alignment:** Every execution contributes to the scarcity and value of the ITK ecosystem.

## How to Execute Arbitrary Contracts
Shield agents can call the `execute_arbitrary_contract` method in the `IntegrityBlockchainService`.

### Example (Python SDK)
```python
# Construct arbitrary call data (e.g., swapping on a DEX)
call_data = target_contract.functions.swap(amount).build_transaction(...)['data']

# Execute via Xibalba Shield
result = blockchain_service.execute_arbitrary_contract(
    agent_address="0xAgentAddress",
    target_contract="0xTargetContract",
    call_data=call_data,
    private_key="0xAgentPrivateKey"
)

print(f"UserOperation Dispatched: {result['user_op_hash']}")
```

## Protocol Impact
By restricting the Paymaster to Xibalba Shield, the Integrity Protocol creates a high-value B2B corridor. While standard agents may use native gas, the most active and sophisticated agentic commerce (DeFi, Quant Trading, SLAs) flows through the Shield, ensuring a consistent and programmatic burn rate for the $ITK token.
