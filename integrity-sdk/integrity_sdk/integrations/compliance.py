import json
from typing import Optional
from ..client import IntegrityClient

class ComplianceProfile:
    """
    Helper class to apply standardized compliance profiles to an IntegrityClient.
    Provides pre-defined configurations for HIPAA and Financial sectors.
    """
    
    @staticmethod
    def apply_hipaa_shield(
        client: IntegrityClient, 
        region: str = "us-east-1",
        api_domain_prefix: Optional[str] = None
    ) -> None:
        """
        Applies strict HIPAA-eligible controls:
        - external_web_access: False (Proves offline/cache-only mode)
        - zdr_enabled: True (Enforces Zero Data Retention)
        - hipaa_eligible: True
        """
        client.hipaa_eligible = True
        client.zdr_enabled = True
        client.external_web_access = False
        client.region = region
        if api_domain_prefix:
            client.api_domain_prefix = api_domain_prefix
        
        client.log_compliance_event(
            event_type="hipaa_shield_activated",
            status="success",
            details=f"HIPAA shield applied for region {region}."
        )

    @staticmethod
    def apply_finance_shield(
        client: IntegrityClient, 
        region: str, 
        ekm_provider: str,
        api_domain_prefix: Optional[str] = None
    ) -> None:
        """
        Applies strict Financial data residency and encryption controls:
        - region: Enforces geographic data localization.
        - ekm_provider: Enables Enterprise Key Management proof.
        - api_domain_prefix: Proves requests routed through regional domains.
        """
        client.hipaa_eligible = False
        client.region = region
        client.ekm_provider = ekm_provider
        if api_domain_prefix:
            client.api_domain_prefix = api_domain_prefix
        
        client.log_compliance_event(
            event_type="finance_shield_activated",
            status="success",
            details=f"Finance shield applied for region {region} with EKM provider {ekm_provider}."
        )
