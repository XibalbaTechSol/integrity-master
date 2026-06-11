import axios from 'axios';
import { ethers } from 'ethers';
import * as crypto from 'crypto';

/**
 * Xibalba Solutions: Integrity Framework SDK (v1.1)
 * "Form-First Engineering. Mathematical Certainty."
 */

export interface IntegrityReport {
    deal_id: string;
    performer_address: string;
    amount: number;
    latency_ms: number;
    accuracy_score: number;
    metadata?: Record<string, any>;
}

export interface IntegrityResponse {
    status: string;
    calculated_entropy?: number;
    ais_impact?: number;
    integrity_hash?: string;
    message?: string;
}

export class IntegritySDK {
    private backendUrl: string;
    private agentAddress: string;
    private wallet: ethers.Wallet | null = null;
    private localMode: boolean;
    private apiKey: string;

    constructor(config: {
        backendUrl?: string;
        agentAddress: string;
        privateKey?: string;
        localMode?: boolean;
    }) {
        this.backendUrl = config.backendUrl || 'http://localhost:8001';
        this.agentAddress = config.agentAddress;
        this.localMode = config.localMode || false;
        this.apiKey = process.env.INTEGRITY_API_KEY || 'xib_dev_temp_key';

        if (config.privateKey) {
            this.wallet = new ethers.Wallet(config.privateKey);
        }
    }

    private async signPayload(payload: any): Promise<string> {
        if (!this.wallet) {
            return 'unsigned_mock_sig';
        }
        const message = JSON.stringify(payload, Object.keys(payload).sort());
        return await this.wallet.signMessage(message);
    }

    public async reportMetrics(report: IntegrityReport): Promise<IntegrityResponse> {
        const payload: any = {
            ...report,
            agent_address: this.agentAddress,
            contract_value_itk: report.amount,
            timestamp: Math.floor(Date.now() / 1000),
            metadata: report.metadata || {}
        };

        payload.signature = await this.signPayload(payload);

        if (this.localMode) {
            return this.simulateResponse(payload);
        }

        try {
            const response = await axios.post(`${this.backendUrl}/v1/transactions/report`, payload, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            return response.data;
        } catch (error: any) {
            return {
                status: 'ERROR',
                message: `Integrity Backend Connectivity Issue: ${error.message}`
            };
        }
    }

    private simulateResponse(payload: any): IntegrityResponse {
        const mockHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
        return {
            status: 'VALIDATED_LOCAL',
            calculated_entropy: 0.12,
            ais_impact: 0.85,
            integrity_hash: mockHash,
            message: 'Transaction validated in Local Mode.'
        };
    }

    public async getReputation(address: string): Promise<any> {
        if (this.localMode) {
            return { address, ais: 750, tier: 'AAA', status: 'MOCK' };
        }
        try {
            const response = await axios.get(`${this.backendUrl}/v1/identity/${address}`);
            return response.data;
        } catch (error: any) {
            return { status: 'ERROR', message: error.message };
        }
    }
}
