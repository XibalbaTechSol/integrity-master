import requests
from eth_account import Account
from eth_account.messages import encode_defunct
from eth_utils import keccak, to_bytes, to_hex

class IntegrityBundler:
    """
    Handles the submission of ERC-4337 UserOperations to a Bundler network,
    utilizing the IntegrityPaymaster for gasless transactions.
    """
    def __init__(self, entry_point: str, paymaster_url: str, bundler_url: str, chain_id: int):
        self.entry_point = entry_point
        self.paymaster_url = paymaster_url
        self.bundler_url = bundler_url
        self.chain_id = chain_id

    def submit_user_op(self, sender: str, call_data: str, private_key: str) -> str:
        """
        Constructs, signs, and submits a UserOperation.
        """
        # 1. Construct UserOp
        # Note: Nonce should be fetched from the EntryPoint in production
        user_op = {
            "sender": sender,
            "nonce": hex(0), 
            "initCode": "0x",
            "callData": call_data,
            "callGasLimit": hex(300000),
            "verificationGasLimit": hex(300000),
            "preVerificationGas": hex(120000),
            "maxFeePerGas": hex(1000000000),
            "maxPriorityFeePerGas": hex(1000000000),
            "paymasterAndData": "0x",
            "signature": "0x"
        }

        # 2. Get Paymaster Sponsorship
        try:
            # Hash UserOp for sponsorship authorization
            user_op_hash = self._calculate_user_op_hash(user_op)
            
            resp = requests.post(self.paymaster_url, json={
                "user_op_hash": user_op_hash,
                "agent_address": sender
            })
            if resp.status_code == 200:
                data = resp.json()
                user_op["paymasterAndData"] = data["paymaster_and_data"]
                print(f"[Paymaster] Sponsored transaction authorized.")
        except Exception as e:
            print(f"[Paymaster] Sponsorship failed: {e}. Proceeding without sponsorship.")

        # 3. Sign UserOperation
        final_hash = self._calculate_user_op_hash(user_op)
        signed_message = Account.sign_message(encode_defunct(hexstr=final_hash), private_key=private_key)
        user_op["signature"] = signed_message.signature.hex()

        # 4. Submit to Bundler via JSON-RPC
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_sendUserOperation",
            "params": [user_op, self.entry_point]
        }
        
        try:
            bundler_resp = requests.post(self.bundler_url, json=payload)
            if bundler_resp.status_code == 200:
                result = bundler_resp.json()
                if "error" in result:
                    raise Exception(f"Bundler error: {result['error']}")
                return result["result"] # This is the UserOpHash
        except Exception as e:
            print(f"[Bundler] Submission failed: {e}")
            return "0x_SUBMISSION_FAILED"

        return "0x_USER_OP_SENT"

    def _calculate_user_op_hash(self, user_op: dict) -> str:
        """
        Calculates the EIP-4337 UserOperation hash.
        """
        # Pack the UserOperation values (simplified version of abi.encode)
        packed = b"".join([
            to_bytes(hexstr=user_op["sender"]),
            to_bytes(int(user_op["nonce"], 16)).rjust(32, b"\x00"),
            keccak(to_bytes(hexstr=user_op["initCode"])),
            keccak(to_bytes(hexstr=user_op["callData"])),
            to_bytes(int(user_op["callGasLimit"], 16)).rjust(32, b"\x00"),
            to_bytes(int(user_op["verificationGasLimit"], 16)).rjust(32, b"\x00"),
            to_bytes(int(user_op["preVerificationGas"], 16)).rjust(32, b"\x00"),
            to_bytes(int(user_op["maxFeePerGas"], 16)).rjust(32, b"\x00"),
            to_bytes(int(user_op["maxPriorityFeePerGas"], 16)).rjust(32, b"\x00"),
            keccak(to_bytes(hexstr=user_op["paymasterAndData"]))
        ])
        
        user_op_hash = keccak(packed)
        # Chain ID and Entry Point are part of the final hash
        final_packed = b"".join([
            user_op_hash,
            to_bytes(hexstr=self.entry_point),
            to_bytes(self.chain_id).rjust(32, b"\x00")
        ])
        
        return to_hex(keccak(final_packed))
