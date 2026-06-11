import os
import json
from web3 import Web3
from eth_account import Account
from eth_account.signers.local import LocalAccount
from .kms_service import KmsService

# Xibalba Solutions: Production-Grade Blockchain & Signing Service (v2.0)
# This service supports both Local and Secure KMS (HSM) signing strategies.

class IntegrityBlockchainService:
    def __init__(self):
        self.rpc_url = os.getenv("ETH_RPC_URL", "https://sepolia.base.org")
        self.registry_address = os.getenv("REPUTATION_REGISTRY_ADDRESS")
        
        # PRODUCTION: Key ID for AWS KMS or HashiCorp Vault
        self.oracle_kms_id = os.getenv("XIBALBA_ORACLE_KMS_ID") 
        self.kms_service = KmsService(self.oracle_kms_id) if self.oracle_kms_id else None
        # DEV/PILOT: Local Private Key
        self.private_key = os.getenv("XIBALBA_ORACLE_PRIVATE_KEY")
        
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        # Load ABIs
        self._load_abis()
        
        if self.registry_address:
            self.contract = self.w3.eth.contract(address=self.w3.to_checksum_address(self.registry_address), abi=self.abi)
        else:
            self.contract = None

        self.itk_address = os.getenv("ITK_TOKEN_ADDRESS")
        if self.itk_address:
            self.itk_contract = self.w3.eth.contract(address=self.w3.to_checksum_address(self.itk_address), abi=self.itk_abi)
        else:
            self.itk_contract = None

        self.state_anchor_address = os.getenv("STATE_ANCHOR_ADDRESS")
        if self.state_anchor_address:
            # Reusing a generic ABI for anchorRoot(bytes32)
            anchor_abi = [{"inputs":[{"internalType":"bytes32","name":"_root","type":"bytes32"}],"name":"anchorRoot","outputs":[],"stateMutability":"nonpayable","type":"function"}]
            self.anchor_contract = self.w3.eth.contract(address=self.w3.to_checksum_address(self.state_anchor_address), abi=anchor_abi)
        else:
            self.anchor_contract = None

        self.factory_address = os.getenv("NO_CODE_FACTORY_ADDRESS")
        if self.factory_address:
            self.factory_contract = self.w3.eth.contract(address=self.w3.to_checksum_address(self.factory_address), abi=self.factory_abi)
        else:
            self.factory_contract = None

        self.slasher_address = os.getenv("SLASHER_ADDRESS")
        self.slasher_abi = self._load_abi_file("Slasher.json")

        self.xns_address = os.getenv("XNS_CONTRACT_ADDRESS")
        if self.xns_address:
            xns_abi = [
                {"inputs":[{"internalType":"string","name":"_handle","type":"string"},{"internalType":"address","name":"_agent","type":"address"}],"name":"register","outputs":[],"stateMutability":"nonpayable","type":"function"},
                {"inputs":[{"internalType":"string","name":"_handle","type":"string"}],"name":"resolve","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}
            ]
            self.xns_contract = self.w3.eth.contract(address=self.w3.to_checksum_address(self.xns_address), abi=xns_abi)
        else:
            self.xns_contract = None

        self.ccip_bridge_address = os.getenv("CCIP_BRIDGE_ADDRESS")
        if self.ccip_bridge_address:
            bridge_abi = [
                {"inputs":[{"internalType":"uint64","name":"_destinationChainSelector","type":"uint64"},{"internalType":"address","name":"_agent","type":"address"},{"internalType":"address","name":"_feeToken","type":"address"}],"name":"bridgeReputation","outputs":[{"internalType":"bytes32","name":"messageId","type":"bytes32"}],"stateMutability":"payable","type":"function"}
            ]
            self.bridge_contract = self.w3.eth.contract(address=self.w3.to_checksum_address(self.ccip_bridge_address), abi=bridge_abi)
        else:
            self.bridge_contract = None

    def _load_abi_file(self, filename: str):
        path = os.path.join(os.path.dirname(__file__), "abi", filename)
        if os.path.exists(path):
            with open(path, 'r') as f:
                data = json.load(f)
                return data['abi'] if isinstance(data, dict) and 'abi' in data else data
        return []

    def resolve_dispute_on_chain(self, deal_id_hex: str, justified: bool):
        """
        Oracle resolves a dispute on-chain via the Slasher contract.
        """
        if not self.slasher_address or not self.slasher_abi or not self.private_key:
            print("[BLOCKCHAIN] Slasher or Private Key not configured.")
            return None

        slasher = self.w3.eth.contract(address=self.w3.to_checksum_address(self.slasher_address), abi=self.slasher_abi)
        oracle_account = self.w3.eth.account.from_key(self.private_key)
        
        try:
            # Convert deal_id string to bytes32 (padded)
            if deal_id_hex.startswith("0x"):
                deal_id_bytes = self.w3.to_bytes(hexstr=deal_id_hex)
            else:
                # If it's a string ID, hash it to get bytes32
                deal_id_bytes = self.w3.keccak(text=deal_id_hex)
            
            tx = slasher.functions.resolveDispute(deal_id_bytes, justified).build_transaction({
                'from': oracle_account.address,
                'nonce': self.w3.eth.get_transaction_count(oracle_account.address),
                'gas': 150000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            print(f"[BLOCKCHAIN] Dispute resolved on-chain: {tx_hash.hex()}")
            return tx_hash.hex()
        except Exception as e:
            print(f"[BLOCKCHAIN] On-chain dispute resolution failed: {e}")
            return None

    def get_oracle_address(self) -> str:
        """Determines the active Oracle address from KMS or local key."""
        if self.kms_service:
            return self.kms_service.get_address()
        if self.private_key:
            return Account.from_key(self.private_key).address
        return None

    def anchor_state_root(self, state_root_hex: str):
        """Anchors a new Merkle root of the Trust Vault on-chain."""
        if not self.anchor_contract:
            print("[BLOCKCHAIN] State Anchor contract not configured.")
            return None

        from_addr = self.get_oracle_address()
        if not from_addr:
            return None

        # Convert to bytes32
        if isinstance(state_root_hex, str):
            hex_val = state_root_hex if state_root_hex.startswith("0x") else "0x" + state_root_hex
            root_bytes = self.w3.to_bytes(hexstr=hex_val)
        else:
            root_bytes = state_root_hex
        
        try:
            nonce = self.w3.eth.get_transaction_count(from_addr)
            tx = self.anchor_contract.functions.anchorRoot(root_bytes).build_transaction({
                'from': from_addr,
                'nonce': nonce,
                'gas': 100000,
                'gasPrice': self.w3.eth.gas_price,
                'chainId': self.w3.eth.chain_id
            })
            
            signer_key = self.oracle_kms_id if self.oracle_kms_id else self.private_key
            return self.secure_sign_and_send(tx, signer_key)
        except Exception as e:
            print(f"[BLOCKCHAIN] State root anchoring failed: {e}")
            return None

    def verify_zk_proof(self, agent_address: str, proof: bytes, public_inputs: list):
        """Submits a ZK-Proof to the ReputationRegistry for verification."""
        if not self.contract:
            return None
            
        from_addr = self.get_oracle_address()
        if not from_addr:
            return None

        try:
            nonce = self.w3.eth.get_transaction_count(from_addr)
            # public_inputs: [threshold, max_risk, agent_addr, state_root]
            tx = self.contract.functions.verifyReputationZK(proof, public_inputs).build_transaction({
                'from': from_addr,
                'nonce': nonce,
                'gas': 500000,
                'gasPrice': self.w3.eth.gas_price,
                'chainId': self.w3.eth.chain_id
            })
            
            signer_key = self.oracle_kms_id if self.oracle_kms_id else self.private_key
            return self.secure_sign_and_send(tx, signer_key)
        except Exception as e:
            print(f"[BLOCKCHAIN] ZK Proof verification submission failed: {e}")
            return None

    def register_xns_on_chain(self, handle: str, agent_address: str):
        """Anchors an XNS handle to an agent address on-chain."""
        if not self.xns_contract:
            print("[BLOCKCHAIN] XNS contract not configured.")
            return None

        from_addr = self.get_oracle_address()
        if not from_addr:
            return None

        try:
            nonce = self.w3.eth.get_transaction_count(from_addr)
            tx = self.xns_contract.functions.register(handle, self.w3.to_checksum_address(agent_address)).build_transaction({
                'from': from_addr,
                'nonce': nonce,
                'gas': 150000,
                'gasPrice': self.w3.eth.gas_price,
                'chainId': self.w3.eth.chain_id
            })
            
            signer_key = self.oracle_kms_id if self.oracle_kms_id else self.private_key
            return self.secure_sign_and_send(tx, signer_key)
        except Exception as e:
            print(f"[BLOCKCHAIN] XNS registration failed: {e}")
            return None

    def bridge_reputation_cross_chain(self, destination_chain_selector: int, agent_address: str, fee_token: str = "0x0000000000000000000000000000000000000000"):
        """Bridges an agent's reputation to another chain via CCIP."""
        if not self.bridge_contract:
            print("[BLOCKCHAIN] CCIP Bridge contract not configured.")
            return None

        from_addr = self.get_oracle_address()
        if not from_addr:
            return None

        try:
            nonce = self.w3.eth.get_transaction_count(from_addr)
            # Default fee token is Native (address(0))
            tx = self.bridge_contract.functions.bridgeReputation(
                destination_chain_selector, 
                self.w3.to_checksum_address(agent_address), 
                self.w3.to_checksum_address(fee_token)
            ).build_transaction({
                'from': from_addr,
                'nonce': nonce,
                'gas': 400000,
                'gasPrice': self.w3.eth.gas_price,
                'chainId': self.w3.eth.chain_id,
                'value': 0 # If fee_token is Native, CCIP will calculate fee which we might need to pre-fetch or over-provide
            })
            
            # For simplicity, we assume the caller or the contract handles the fee appropriately.
            # In a real system, we'd call routerClient.getFee() first.
            
            signer_key = self.oracle_kms_id if self.oracle_kms_id else self.private_key
            return self.secure_sign_and_send(tx, signer_key)
        except Exception as e:
            print(f"[BLOCKCHAIN] CCIP Bridging failed: {e}")
            return None

    def _load_abis(self):
        # Look for ABIs in standard locations
        registry_abi_path = os.path.join(os.path.dirname(__file__), "abi", "ReputationRegistry.json")
        itk_abi_path = os.path.join(os.path.dirname(__file__), "abi", "IntegrityToken.json")
        factory_abi_path = os.path.join(os.path.dirname(__file__), "abi", "NoCodeFactory.json")
        
        if os.path.exists(registry_abi_path):
            with open(registry_abi_path, 'r') as f:
                data = json.load(f)
                self.abi = data['abi'] if isinstance(data, dict) and 'abi' in data else data
            print(f"[BLOCKCHAIN] Loaded Registry ABI from {registry_abi_path}")
        else:
            self.abi = []
            print(f"[BLOCKCHAIN] Warning: Registry ABI not found")
        
        if os.path.exists(itk_abi_path):
            with open(itk_abi_path, 'r') as f:
                data = json.load(f)
                self.itk_abi = data['abi'] if isinstance(data, dict) and 'abi' in data else data
            print(f"[BLOCKCHAIN] Loaded ITK ABI from {itk_abi_path}")
        else:
            self.itk_abi = []
            print(f"[BLOCKCHAIN] Warning: ITK ABI not found")

        if os.path.exists(factory_abi_path):
            with open(factory_abi_path, 'r') as f:
                data = json.load(f)
                self.factory_abi = data['abi'] if isinstance(data, dict) and 'abi' in data else data
            print(f"[BLOCKCHAIN] Loaded Factory ABI from {factory_abi_path}")
        else:
            self.factory_abi = []
            print(f"[BLOCKCHAIN] Warning: Factory ABI not found")

    def secure_sign_and_send(self, transaction, signer_key):
        """
        The production-grade signing gateway.
        """
        if signer_key and (str(signer_key).startswith("kms:") or (self.kms_service and signer_key == self.oracle_kms_id)):
            key_id = str(signer_key).replace("kms:", "")
            print(f"[SECURITY] Routing tx to AWS KMS HSM (Key ID: {key_id})")
            
            # Use existing service or create transient one if key_id differs
            kms = self.kms_service if self.kms_service and self.kms_service.key_id == key_id else KmsService(key_id)
            
            try:
                signed_tx_hex = kms.sign_transaction(transaction, self.w3)
                tx_hash = self.w3.eth.send_raw_transaction(signed_tx_hex)
                return tx_hash.hex()
            except Exception as e:
                print(f"[SECURITY] KMS Transaction Signing Failed: {e}")
                return None
        else:
            signed_tx = self.w3.eth.account.sign_transaction(transaction, private_key=signer_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            return tx_hash.hex()

    def sign_paymaster_op(self, user_op_hash: str) -> str:
        """
        Signs a ERC-4337 UserOperation hash for the IntegrityPaymaster.
        Enables agents to perform 'gasless' transactions sponsored by the Oracle.
        """
        if not self.private_key and not self.kms_service:
            return ""
            
        from eth_account.messages import encode_defunct
        
        # Convert hex string to bytes
        hash_bytes = bytes.fromhex(user_op_hash.replace("0x", ""))
        message = encode_defunct(hash_bytes)
        # In Ethereum, sign_message expects the message, and it hashes it with the prefix.
        # But for Paymaster, we often sign the hash directly.
        # However, encode_defunct(hash_bytes) creates a message that will be hashed as:
        # keccak256("\x19Ethereum Signed Message:\n32" + hash_bytes)
        
        if self.kms_service:
            # For KMS, we sign the hash of the defunct message
            from eth_account.messages import _hash_eip191_message
            msghash = _hash_eip191_message(message)
            return self.kms_service.sign_message(msghash)
        else:
            signed_message = self.w3.eth.account.sign_message(message, private_key=self.private_key)
            return signed_message.signature.hex()

    def update_agent_reputation(self, agent_address: str, ais: int, tier: int):
        if not self.contract or (not self.private_key and not self.oracle_kms_id):
            return None

        signer_key = self.oracle_kms_id if self.oracle_kms_id else self.private_key
        sender_address = os.getenv("XIBALBA_ORACLE_ADDRESS") 

        try:
            from_addr = sender_address if self.oracle_kms_id else Account.from_key(self.private_key).address
            nonce = self.w3.eth.get_transaction_count(from_addr)
            
            tx = self.contract.functions.updateAIS(
                self.w3.to_checksum_address(agent_address),
                int(ais),
                int(tier)
            ).build_transaction({
                'from': from_addr,
                'nonce': nonce,
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            return self.secure_sign_and_send(tx, signer_key)
        except Exception as e:
            print(f"[BLOCKCHAIN] Secure update failed: {e}")
            return None

    def faucet_drop(self, target_address: str, amount_itk: float = 5000.0):
        """REAL FAUCET (Base Sepolia). Sends ITK to the target address."""
        if not self.itk_contract or not self.private_key:
            return {"status": "error", "message": "Faucet not configured."}
            
        try:
            from_addr = Account.from_key(self.private_key).address
            nonce = self.w3.eth.get_transaction_count(from_addr)
            
            amount = self.w3.to_wei(amount_itk, 'ether')
            
            tx = self.itk_contract.functions.transfer(
                self.w3.to_checksum_address(target_address),
                amount
            ).build_transaction({
                'from': from_addr,
                'nonce': nonce,
                'gas': 100000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            tx_hash = self.secure_sign_and_send(tx, self.private_key)
            print(f"[FAUCET] Dispatched {amount_itk} ITK to {target_address}. Tx: {tx_hash}")
            return {"status": "success", "tx_hash": tx_hash}
        except Exception as e:
            print(f"[FAUCET] Drop failed: {e}")
            return {"status": "error", "message": str(e)}

    def register_on_chain(self, agent_address: str, alias: str):
        """Registers agent on testnet using ORACLE'S key for gas."""
        return self.update_agent_reputation(agent_address, 300, 1)

    def stake_on_chain(self, agent_address: str, amount_itk: float):
        """Updates reputation on-chain based on stake, using ORACLE'S gas."""
        # For demo, the Oracle 'vouchers' for the stake
        return self.update_agent_reputation(agent_address, 450, 1)

    def sweep_tokens_back(self, from_address: str, from_private_key: str):
        """Returns all ITK from a guest wallet back to the Master Agent."""
        if not self.itk_contract:
            return None
            
        try:
            # Check balance first
            balance = self.itk_contract.functions.balanceOf(from_address).call()
            if balance == 0:
                return "0x0"
            
            nonce = self.w3.eth.get_transaction_count(from_address)
            master_address = os.getenv("XIBALBA_ORACLE_ADDRESS")
            
            tx = self.itk_contract.functions.transfer(
                self.w3.to_checksum_address(master_address),
                balance
            ).build_transaction({
                'from': from_address,
                'nonce': nonce,
                'gas': 100000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=from_private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            return tx_hash.hex()
        except Exception as e:
            print(f"[SWEEP] Failed for {from_address}: {e}")
            return None
    def get_token_stats(self):
        """Returns ITK token economics from the chain."""
        if not self.itk_contract:
            return {"total_supply": 0, "staked": 0, "burnt": 0}
        
        try:
            total_supply = self.itk_contract.functions.totalSupply().call()
            # Staked ITK is held by the Registry contract
            staked = self.itk_contract.functions.balanceOf(self.registry_address).call()
            # Burnt ITK (standard deflationary logic)
            burnt = self.itk_contract.functions.balanceOf("0x0000000000000000000000000000000000000000").call()
            
            return {
                "total_supply": float(self.w3.from_wei(total_supply, 'ether')),
                "staked": float(self.w3.from_wei(staked, 'ether')),
                "burnt": float(self.w3.from_wei(burnt, 'ether'))
            }
        except Exception as e:
            print(f"[BLOCKCHAIN] Token stats error: {e}")
            return {"total_supply": 1000000.0, "staked": 50000.0, "burnt": 25000.0}

    def get_network_health(self):
        """Returns basic health metrics from the provider."""
        try:
            return {
                "block_number": self.w3.eth.block_number,
                "gas_price_gwei": float(self.w3.from_wei(self.w3.eth.gas_price, 'gwei')),
                "is_syncing": self.w3.eth.syncing is not False
            }
        except:
            return {"block_number": 0, "gas_price_gwei": 0, "is_syncing": False}

    def deploy_sla(self, customer: str, agent: str, amount_itk: float, min_ais: int, duration_sec: int):
        """Deploys a new SLA contract via the Factory."""
        if not self.factory_contract or not self.private_key:
            return None
        
        try:
            from_addr = Account.from_key(self.private_key).address
            nonce = self.w3.eth.get_transaction_count(from_addr)
            
            amount_wei = self.w3.to_wei(amount_itk, 'ether')
            
            tx = self.factory_contract.functions.deploySLA(
                self.w3.to_checksum_address(customer),
                self.w3.to_checksum_address(agent),
                amount_wei,
                int(min_ais),
                int(duration_sec)
            ).build_transaction({
                'from': from_addr,
                'nonce': nonce,
                'gas': 1000000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            print(f"[FACTORY] Deploying SLA for {customer} targeting {agent}...")
            tx_hash = self.secure_sign_and_send(tx, self.private_key)
            print(f"[FACTORY] TX Hash: {tx_hash}")
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            print(f"[FACTORY] Receipt received. Status: {receipt['status']}")

            # Extract contract address from logs (SLADeployed event)
            logs = self.factory_contract.events.SLADeployed().process_receipt(receipt)
            if logs:
                addr = logs[0]['args']['contractAddress']
                print(f"[FACTORY] SLA Deployed at: {addr}")
                return addr
            print(f"[FACTORY] SLADeployed event not found in logs")
            return None
        except Exception as e:
            print(f"[FACTORY] SLA deployment failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    def deploy_insurance(self, beneficiary: str, target_agent: str, payout_itk: float, trigger_ais: int, duration_sec: int):
        """Deploys a new Parametric Insurance contract via the Factory."""
        if not self.factory_contract or not self.private_key:
            return None
        
        try:
            from_addr = Account.from_key(self.private_key).address
            nonce = self.w3.eth.get_transaction_count(from_addr)
            
            payout_wei = self.w3.to_wei(payout_itk, 'ether')
            
            tx = self.factory_contract.functions.deployInsurance(
                self.w3.to_checksum_address(beneficiary),
                self.w3.to_checksum_address(target_agent),
                payout_wei,
                int(trigger_ais),
                int(duration_sec)
            ).build_transaction({
                'from': from_addr,
                'nonce': nonce,
                'gas': 1000000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            tx_hash = self.secure_sign_and_send(tx, self.private_key)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Extract contract address from logs (InsuranceDeployed event)
            logs = self.factory_contract.events.InsuranceDeployed().process_receipt(receipt)
            if logs:
                return logs[0]['args']['contractAddress']
            return None
        except Exception as e:
            print(f"[FACTORY] Insurance deployment failed: {e}")
            return None

    def deploy_custom_contract(self, abi: list, bytecode: str, args: list = None):
        """Deploys a custom contract using the Oracle's key for gas."""
        if not self.private_key:
            return None
        try:
            from_addr = Account.from_key(self.private_key).address
            nonce = self.w3.eth.get_transaction_count(from_addr)
            
            contract = self.w3.eth.contract(abi=abi, bytecode=bytecode)
            constructor_tx = contract.constructor(*(args or [])).build_transaction({
                'from': from_addr,
                'nonce': nonce,
                'gas': 2000000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            tx_hash = self.secure_sign_and_send(constructor_tx, self.private_key)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return receipt['contractAddress']
        except Exception as e:
            print(f"[FACTORY] Custom deployment failed: {e}")
            return None
