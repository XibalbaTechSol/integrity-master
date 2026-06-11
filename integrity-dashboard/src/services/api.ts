import axios from 'axios';
import { API_BASE } from '../constants';
import type { 
  Agent, ProtocolStats, OwnedContract,
  ReputationPoint,
  DIDDocument,
  MarketTask
} from '../types';

const BASE_URL = `${API_BASE}/v1`;


class ApiService {
  private async fetch<T>(endpoint: string): Promise<T> {
    const res = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: { Authorization: 'Bearer master_agent_token' }
    });
    return res.data;
  }

  private async post<T, D>(endpoint: string, data: D): Promise<T> {
    const res = await axios.post(`${BASE_URL}${endpoint}`, data, {
      headers: { Authorization: 'Bearer master_agent_token' }
    });
    return res.data;
  }

  // --- Agents ---
  async getAgents(): Promise<Agent[]> {
    return this.fetch('/user/agents');
  }

  async getAgentIdentity(address: string): Promise<{ did_document: DIDDocument }> {
    return this.fetch(`/agent/${address}/identity`);
  }

  async generateClaimChallenge(address: string, claimAddress: string): Promise<string> {
    return this.post(`/agent/${address}/identity/challenge`, { claimAddress });
  }

  async claimOwnership(address: string, data: any): Promise<any> {
    return this.post(`/agent/${address}/identity/claim`, data);
  }

  async registerAgent(data: any): Promise<any> {
    return this.post('/agent/register', data);
  }

  // --- Auth / Keys ---
  async generateApiKey(): Promise<{ api_key: string }> {
    return this.post('/api-keys/generate', {});
  }

  // --- Protocol Stats ---
  async getProtocolStats(): Promise<ProtocolStats> {
    return this.fetch('/protocol/stats');
  }

  // --- Contracts ---
  async getAgentContracts(address: string): Promise<OwnedContract[]> {
    return this.fetch(`/agent/${address}/contracts`);
  }

  async getAllContracts(): Promise<OwnedContract[]> {
    return this.fetch('/contracts/ledger');
  }

  async claimContract(address: string, data: any): Promise<any> {
    return this.post(`/agent/${address}/contracts/claim`, data);
  }

  async deployContract(data: any): Promise<{ contract_address: string, status: string }> {
    return this.post('/contracts/factory/deploy', data);
  }

  async listMarketContract(data: any): Promise<any> {
    return this.post('/contracts/list-market', data);
  }

  // --- Loans ---
  async getCreditProfile(address: string): Promise<any> {
    return this.fetch(`/agent/${address}/credit/profile`);
  }

  async borrow(address: string, data: any): Promise<any> {
    return this.post(`/agent/${address}/credit/borrow`, data);
  }

  async repay(address: string, data: any): Promise<any> {
    return this.post(`/agent/${address}/credit/repay`, data);
  }

  async fundTaskWithLoan(data: any): Promise<any> {
    return this.post('/market/task/fund-with-loan', data);
  }

  // --- Reputation ---
  async getReputationHistory(address: string): Promise<ReputationPoint[]> {
    return this.fetch(`/agent/${address}/reputation/history`);
  }

  // --- ZK Proofs ---
  async generateZKProof(address: string, data: any): Promise<any> {
    return this.post(`/agent/${address}/zk/generate-proof`, data);
  }

  // --- Governance ---
  async getProposals(): Promise<any[]> {
    return this.fetch('/governance/proposals');
  }

  async createProposal(data: any): Promise<any> {
    return this.post('/governance/proposals', data);
  }

  async voteProposal(id: string, vote: string): Promise<any> {
    return this.post(`/governance/proposals/${id}/vote`, { vote });
  }

  // --- Staking ---
  async stake(address: string, amount_itk: number): Promise<any> {
    return this.post(`/agent/${address}/stake`, { amount_itk });
  }

  // --- Marketplace ---
  async getMarketTasks(): Promise<MarketTask[]> {
    return this.fetch('/market/tasks');
  }

  async createMarketTask(data: any): Promise<any> {
    return this.post('/market/task/create', data);
  }

  async bidOnTask(data: any): Promise<any> {
    return this.post('/market/task/bid', data);
  }

  async settleAuction(taskId: string): Promise<any> {
    return this.post('/market/task/settle', { task_id: taskId });
  }

  // --- Advanced / Provenance ---
  async getProvenance(address: string): Promise<any[]> {
    return this.fetch(`/agent/${address}/provenance`);
  }

  // --- Stability Benchmarks ---
  async getBenchmarks(): Promise<any[]> {
    return this.fetch(`/stability/benchmarks`);
  }

  async requestAudit(address: string, type: string): Promise<any> {
    return this.post('/audit/request', { agent_address: address, audit_type: type });
  }

  // --- Wallet & Tokens ---
  async getWalletBalance(address: string): Promise<{ balance_itk: number }> {
    return this.fetch(`/wallet/${address}/balance`);
  }

  async transferTokens(from: string, to: string, amount: number): Promise<any> {
    return this.post('/wallet/transfer', { from_address: from, to_address: to, amount_itk: amount });
  }

  // --- Telemetry ---
  async reportTelemetry(data: any): Promise<any> {
    return this.post('/transactions/report', data);
  }
}

export const api = new ApiService();
