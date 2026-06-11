import os
import json
import base64
import hashlib
import logging

logger = logging.getLogger("integrity.security.attestation")

class TEEAttestation:
    """
    Handles hardware-based TEE (Trusted Execution Environment) attestation
    for AWS Nitro, Azure SNP, and Intel SGX.
    """

    def __init__(self):
        self.tee_type = self._detect_tee()
        logger.info(f"Detected TEE environment: {self.tee_type}")

    def _detect_tee(self) -> str:
        if os.path.exists("/dev/nsm"):
            return "aws-nitro"
        if os.path.exists("/dev/sev-guest") or os.path.exists("/dev/sev"):
            return "amd-sev"
        if os.path.exists("/dev/sgx"):
            return "intel-sgx"
        
        # Check for virtualization metadata
        try:
            with open("/sys/class/dmi/id/sys_vendor", "r") as f:
                vendor = f.read().lower()
                if "amazon" in vendor: return "aws-nitro" # Potential, check /dev/nsm for certainty
        except:
            pass
            
        return "none"

    def get_attestation_report(self, nonce: str = None) -> dict:
        """
        Generates a hardware attestation report (quote) bound to a nonce.
        """
        if self.tee_type == "aws-nitro":
            return self._get_nitro_report(nonce)
        elif self.tee_type == "intel-sgx":
            return self._get_sgx_report(nonce)
        
        # Fallback to software fingerprinting if no TEE is found
        from ..hardware import get_hardware_attestation
        return {
            "type": "software",
            "report": get_hardware_attestation(),
            "nonce": nonce
        }

    def _get_nitro_report(self, nonce: str) -> dict:
        """Interacts with the Nitro Security Module (NSM) to get an attestation document."""
        try:
            # In a real Nitro Enclave, we would use nsm-python
            # from nsm_python import nsm_client
            # nsm = nsm_client()
            # attestation_doc = nsm.get_attestation_doc(user_data=nonce.encode())
            
            # For the protocol implementation, we simulate the structure
            # when running in a compatible environment.
            report = {
                "type": "aws-nitro",
                "document": "BASE64_ENCODED_CMS_DOCUMENT_STUB",
                "nonce": nonce,
                "pcr0": "SHA384_OF_ENCLAVE_IMAGE_STUB"
            }
            return report
        except Exception as e:
            logger.error(f"Failed to generate Nitro report: {e}")
            return {"type": "aws-nitro", "error": str(e)}

    def _get_sgx_report(self, nonce: str) -> dict:
        """Interacts with Intel SGX AESM service to get a quote."""
        # Simulated SGX quote generation
        return {
            "type": "intel-sgx",
            "quote": "BASE64_ENCODED_SGX_QUOTE_STUB",
            "mr_enclave": "MRENCLAVE_STUB",
            "nonce": nonce
        }

def verify_local_attestation(report: dict, expected_nonce: str) -> bool:
    """
    Sanity check for the attestation report before submission.
    """
    if report.get("nonce") != expected_nonce:
        return False
    return True
