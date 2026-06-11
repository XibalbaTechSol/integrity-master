#!/usr/bin/env python3
import os
import sys
import hashlib
import time
import argparse

# Xibalba Solutions: ITK Local Prover (Genesis Phase)
# "Mathematical Certainty. Visual Accountability."

DIFFICULTY = 4  # Number of leading zeros required

def calculate_pow(content: str) -> tuple[str, int]:
    print(f"[*] Commencing Proof of Work (Difficulty: {DIFFICULTY})...")
    start_time = time.time()
    nonce = 0
    prefix = "0" * DIFFICULTY
    
    while True:
        data = f"{content}{nonce}".encode('utf-8')
        hash_result = hashlib.sha256(data).hexdigest()
        
        if hash_result.startswith(prefix):
            elapsed = time.time() - start_time
            print(f"[*] PoW found in {elapsed:.2f}s!")
            print(f"[*] Nonce: {nonce} -> Hash: {hash_result}")
            return hash_result, nonce
        nonce += 1

def process_file(filepath: str, sign: bool):
    if not os.path.exists(filepath):
        print(f"[!] Error: File '{filepath}' not found.")
        sys.exit(1)
        
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    # Remove any existing Integrity-Checksum lines at the bottom
    while lines and ("Integrity-Checksum:" in lines[-1] or lines[-1].strip() == ""):
        lines.pop()
        
    content = "".join(lines)
    
    hash_val, nonce = calculate_pow(content)
    
    checksum_line = f"\nIntegrity-Checksum: {hash_val} (Nonce: {nonce})\n"
    
    if sign:
        with open(filepath, 'a', encoding='utf-8') as f:
            f.write(checksum_line)
        print(f"[*] Checksum appended to {filepath}")
    else:
        print(f"[*] Calculated Checksum: {checksum_line.strip()}")

def main():
    parser = argparse.ArgumentParser(description="ITK Local Prover - Proof of Work Generator")
    parser.add_argument("file", help="Path to the markdown file or commit message")
    parser.add_argument("--sign", action="store_true", help="Append the checksum to the file")
    
    args = parser.parse_args()
    process_file(args.file, args.sign)

if __name__ == "__main__":
    main()
