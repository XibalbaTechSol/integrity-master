import boto3
import os
import json
from eth_account import Account
from eth_account.messages import encode_defunct
from hexbytes import HexBytes
import rlp
from eth_keys import keys
from eth_utils import to_checksum_address, keccak

# Xibalba Solutions: AWS KMS Signing Service (Institutional Grade)
# Provides SECP256K1 signing for Ethereum transactions and messages using AWS KMS HSM.

class KmsService:
    def __init__(self, key_id: str = None, region: str = None):
        self.key_id = key_id or os.getenv("XIBALBA_ORACLE_KMS_ID")
        self.region = region or os.getenv("AWS_REGION", "us-east-1")
        
        if self.key_id:
            self.kms = boto3.client('kms', region_name=self.region)
        else:
            self.kms = None
            print("[KMS] Warning: XIBALBA_ORACLE_KMS_ID not set. KMS signing will be unavailable.")

    def get_public_key(self) -> bytes:
        """Retrieves the public key from AWS KMS and returns it as uncompressed bytes (64 bytes, no 0x04 prefix)."""
        if not self.kms:
            return None
            
        response = self.kms.get_public_key(KeyId=self.key_id)
        pubkey_der = response['PublicKey']
        
        # DER encoded public key for SECP256K1 is usually 88 bytes.
        # The last 65 bytes are the actual public key (0x04 + 64 bytes).
        # A more robust way is to use a library or look for the BIT STRING.
        # For SECP256K1, the public key starts at offset 23 in the DER.
        return pubkey_der[-64:]

    def get_address(self) -> str:
        """Derives the Ethereum address from the KMS public key."""
        pubkey = self.get_public_key()
        if not pubkey:
            return None
            
        # Ethereum address is the last 20 bytes of the keccak256 hash of the uncompressed public key (64 bytes).
        address_bytes = keccak(pubkey)[-20:]
        return to_checksum_address(address_bytes)

    def sign_transaction(self, tx_dict: dict, w3) -> str:
        """Signs an Ethereum transaction using AWS KMS."""
        if not self.kms:
            raise Exception("KMS client not initialized")

        # 1. Prepare transaction hash for signing
        # We need to sign the RLP encoded transaction
        from eth_account._utils.transactions import encode_transaction, serializable_unsigned_transaction_from_dict
        
        unsigned_tx = serializable_unsigned_transaction_from_dict(tx_dict)
        tx_hash = unsigned_tx.hash()
        
        # 2. Sign with KMS
        signature_der = self._kms_sign(tx_hash)
        
        # 3. Decode DER signature to (r, s)
        r, s = self._decode_der_signature(signature_der)
        
        # 4. Recover 'v'
        # Ethereum EIP-155: v = {0, 1} + CHAIN_ID * 2 + 35
        # We try both v=0 and v=1 and see which one recovers the correct public key.
        public_key = self.get_public_key()
        chain_id = tx_dict.get('chainId', 1)
        
        v = self._recover_v(tx_hash, r, s, public_key)
        
        # Adjust v for EIP-155
        v_eip155 = v + (chain_id * 2) + 35
        
        # 5. Encode signed transaction
        signed_tx_rlp = encode_transaction(unsigned_tx, vrs=(v_eip155, r, s))
        return HexBytes(signed_tx_rlp).hex()

    def sign_message(self, message_hash: bytes) -> str:
        """Signs a message hash (EIP-191) using AWS KMS."""
        if not self.kms:
            raise Exception("KMS client not initialized")
            
        signature_der = self._kms_sign(message_hash)
        r, s = self._decode_der_signature(signature_der)
        
        public_key = self.get_public_key()
        v = self._recover_v(message_hash, r, s, public_key)
        
        # Ethereum message signature format: r (32) + s (32) + v (1)
        # v is usually 27 or 28 for personal_sign
        v_final = v + 27
        
        signature = r.to_bytes(32, 'big') + s.to_bytes(32, 'big') + v_final.to_bytes(1, 'big')
        return HexBytes(signature).hex()

    def _kms_sign(self, digest: bytes) -> bytes:
        response = self.kms.sign(
            KeyId=self.key_id,
            Message=digest,
            MessageType='DIGEST',
            SigningAlgorithm='ECDSA_SHA_256'
        )
        return response['Signature']

    def _decode_der_signature(self, signature_der: bytes) -> tuple:
        """Decodes a DER-encoded ECDSA signature to (r, s)."""
        # DER format: 0x30 [total_len] 0x02 [r_len] [r] 0x02 [s_len] [s]
        offset = 2
        
        # Read r
        if signature_der[offset] != 0x02:
            raise Exception("Invalid DER signature (r marker)")
        offset += 1
        r_len = signature_der[offset]
        offset += 1
        r_bytes = signature_der[offset:offset+r_len]
        offset += r_len
        
        # Read s
        if signature_der[offset] != 0x02:
            raise Exception("Invalid DER signature (s marker)")
        offset += 1
        s_len = signature_der[offset]
        offset += 1
        s_bytes = signature_der[offset:offset+s_len]
        
        r = int.from_bytes(r_bytes, 'big')
        s = int.from_bytes(s_bytes, 'big')
        
        # SECP256K1 s-value must be in the lower half of the curve order
        # Curve order N for SECP256K1
        N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
        if s > N // 2:
            s = N - s
            
        return r, s

    def _recover_v(self, digest: bytes, r: int, s: int, expected_pubkey: bytes) -> int:
        """Recovers the recovery ID 'v' by trying both 0 and 1."""
        for v in [0, 1]:
            try:
                # Use eth_keys to recover public key from signature
                signature = keys.Signature(vrs=(v, r, s))
                recovered_pubkey = signature.recover_public_key_from_msg_hash(digest)
                
                # recovered_pubkey.to_bytes() returns 64 bytes uncompressed
                if recovered_pubkey.to_bytes() == expected_pubkey:
                    return v
            except Exception:
                continue
        
        raise Exception("Failed to recover v: recovered public key does not match expected KMS public key")
