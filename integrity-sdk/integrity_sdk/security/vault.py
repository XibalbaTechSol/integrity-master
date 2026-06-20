from abc import ABC, abstractmethod
from typing import Optional

class KeyVaultInterface(ABC):
    """
    Interface for integrating with external hardware/software vaults.
    Replace local filesystem-based DID keys with this interface for production.
    """
    @abstractmethod
    def sign(self, message: bytes) -> bytes:
        pass
    
    @abstractmethod
    def get_public_key(self) -> bytes:
        pass

# Implementation Example (Future Development):
# class HashiCorpVaultProvider(KeyVaultInterface): ...
