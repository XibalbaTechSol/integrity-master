export const ITK_TOKEN_ADDRESS = "0xF448c05074D435d256D6fbc1fC059019B86A5408";
export const REPUTATION_REGISTRY_ADDRESS = "0x0bd07324980856841e83FF95460CcD46EB9B590a";
export const INTEGRITY_PROTOCOL_ADDRESS = "0xF23c61a9B902eA5b6cb1f8eDecce22B015F07b1A";
export const XIBALBA_AGENT_ADDRESS = "0x67ba5d723e1f5517aff7eb980e2f73a9e17ad556";
export const NO_CODE_FACTORY_ADDRESS = "0x2e35aDd0ec480A301B02aF2619a55cE6d790d3a8";

export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const RPC_URL = "https://sepolia.base.org";

export const IS_PRODUCTION = false; // Toggle for Mainnet migration

export const API_BASE = import.meta.env.VITE_API_BASE || 
  (typeof window !== 'undefined' && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") 
    ? "http://127.0.0.1:8001" 
    : "https://integrity-protocol-backend.onrender.com");

