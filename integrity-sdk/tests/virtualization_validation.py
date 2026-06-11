import os
import sys

# Setup pathing
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from integrity_sdk import get_virtualization_env, get_hardware_attestation

def test_virtualization():
    print("======================================================================")
    print("INTEGRITY SDK — VIRTUALIZATION / VPS PROFILER TEST")
    print("======================================================================")
    
    env_type = get_virtualization_env()
    print(f"Detected Virtualization Environment: '{env_type}'")
    
    # Assert return value is a string and not empty
    assert isinstance(env_type, str), "Virtualization environment result must be a string"
    assert len(env_type) > 0, "Virtualization environment result cannot be empty"
    
    # Audit full attestation
    attestation = get_hardware_attestation()
    print("\nFull Attestation Report:")
    for k, v in attestation.items():
        print(f"  {k}: {v}")
        
    assert "virtualization" in attestation, "Virtualization key missing from attestation report"
    assert attestation["virtualization"] == env_type, "Virtualization report mismatch"

    print("\n======================================================================")
    print("✓ SUCCESS: Virtualization / VPS detection validated successfully!")
    print("======================================================================\n")

if __name__ == "__main__":
    test_virtualization()
