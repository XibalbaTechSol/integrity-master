# Integrity Protocol — On-Chain Contracts

Smart contracts for the **Integrity Protocol (ITK)** testnet on **Base Sepolia**.

## Architecture

```
┌─────────────────────────┐     ┌──────────────────────┐
│   IntegrityRegistry     │     │     StateAnchor       │
│─────────────────────────│     │──────────────────────│
│ • Agent registration    │     │ • Merkle root storage │
│ • Liquidity sources     │     │ • Inclusion proofs    │
│ • Reputation scoring    │     │ • Snapshot anchoring  │
│ • Stake + slashing      │     │                      │
└─────────────────────────┘     └──────────────────────┘
         ▲                               ▲
         │                               │
    Agents stake ETH              Oracle submits roots
    & register DIDs               from PostgreSQL snapshots
```

### IntegrityRegistry.sol

| Function | Access | Description |
|---|---|---|
| `registerAgent(did, hwFingerprint, initialReputation)` | `payable` (anyone) | Register an agent with DID and stake |
| `registerLiquiditySource(did, sourceName, capitalCommitment)` | anyone (agent must exist) | Declare a liquidity source |
| `updateReputation(did, newScore, proof)` | `onlyOwner` | Update an agent's reputation score |
| `slash(did, amount, reason)` | `onlyOwner` | Slash an agent's stake |
| `getAgent(did)` | `view` | Look up an agent by DID |
| `getLiquiditySource(did)` | `view` | Look up a liquidity source by DID |
| `setStakeThreshold(newThreshold)` | `onlyOwner` | Update minimum stake requirement |

### StateAnchor.sol

| Function | Access | Description |
|---|---|---|
| `anchorState(merkleRoot, blockHeight, agentCount)` | `onlyOwner` | Submit a new state snapshot root |
| `verifyInclusion(leaf, proof, root)` | `pure` | Verify a Merkle inclusion proof |
| `getLatestAnchor()` | `view` | Get the most recent anchored snapshot |
| `isRootAnchored(merkleRoot)` | `view` | Check if a root has been anchored |

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `cast`, `anvil`)
- Base Sepolia ETH (faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)

## Setup

```bash
cd /home/xibalba/integrity/contracts

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge install foundry-rs/forge-std --no-commit

# Build
forge build

# Run tests (when test files are added)
forge test -vvv
```

## Environment

Create a `.env` file (never commit this):

```bash
PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=YOUR_BASESCAN_API_KEY
STAKE_THRESHOLD=1000000000000000  # 0.001 ETH in wei
```

Load it:

```bash
source .env
```

## Deploy to Base Sepolia

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  -vvv
```

The script prints deployed addresses. Save them for integration.

## Register Xibalba as Liquidity Source

After deployment, register the Xibalba agent and declare it as a liquidity source using `cast`:

```bash
# Set the registry address from deployment output
REGISTRY=0x<IntegrityRegistry_address>

# 1. Register Xibalba as an agent (stake 0.001 ETH)
cast send $REGISTRY \
  "registerAgent(string,string,uint256)" \
  "did:xibalba:mainframe" \
  "tpm2-sha256:$(sha256sum /sys/class/dmi/id/product_uuid 2>/dev/null | cut -d' ' -f1 || echo 'testnet-fingerprint')" \
  5000 \
  --value 0.001ether \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# 2. Register as a Liquidity Source
cast send $REGISTRY \
  "registerLiquiditySource(string,string,uint256)" \
  "did:xibalba:mainframe" \
  "Xibalba Primary Liquidity Source" \
  1000000000000000000 \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# 3. Verify registration
cast call $REGISTRY \
  "getAgent(string)" \
  "did:xibalba:mainframe" \
  --rpc-url $BASE_SEPOLIA_RPC_URL

cast call $REGISTRY \
  "getLiquiditySource(string)" \
  "did:xibalba:mainframe" \
  --rpc-url $BASE_SEPOLIA_RPC_URL
```

## Local Testing with Anvil

```bash
# Start a local fork of Base Sepolia
anvil --fork-url $BASE_SEPOLIA_RPC_URL

# Deploy locally (in another terminal)
forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

## Security Notes

- **Owner key**: The deployer becomes the contract owner. Use a hardware wallet for mainnet.
- **Slashing**: Only the owner can slash. Future versions will use governance or ZK proofs.
- **Reputation proofs**: The `proof` parameter in `updateReputation` is reserved for future ZK/oracle attestation verification.
- **Stake threshold**: Set conservatively on testnet (0.001 ETH). Adjust for mainnet economics.

## License

MIT
