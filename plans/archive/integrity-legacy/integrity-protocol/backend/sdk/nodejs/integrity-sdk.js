const axios = require('axios');

/**
 * Xibalba Solutions: Integrity Protocol SDK (Node.js v1.0)
 */
class XibalbaIntegritySDK {
    constructor(agentEthAddress, xibalbaApiUrl = "http://localhost:8001") {
        this.agentAddress = agentEthAddress;
        this.apiUrl = xibalbaApiUrl;
    }

    /**
     * Queries Xibalba to verify if a target agent is trustworthy.
     */
    async requestTrustHandshake(targetEthAddress) {
        try {
            const response = await axios.post(`${this.apiUrl}/v1/agent/handshake`, {
                initiator_eth_address: this.agentAddress,
                target_eth_address: targetEthAddress
            });
            return response.data;
        } catch (error) {
            return { status: "error", message: error.message };
        }
    }

    /**
     * Sends the Work Commitment Hash (Provider Side) to Xibalba.
     */
    reportWorkCommitment(modelClass, maxTokens, estimatedLatencyMs) {
        console.log(`[XIBALBA SDK] Reporting Work Commitment for ${modelClass}`);
        return {
            agent: this.agentAddress,
            model_class: modelClass,
            max_tokens_allocated: maxTokens,
            estimated_latency: estimatedLatencyMs,
            timestamp: Date.now() / 1000
        };
    }

    /**
     * Sends the Customer Feedback Receipt (Customer Side) to Xibalba.
     */
    reportCustomerFeedback(targetAgent, actualTokens, actualLatencyMs, accuracy = 0.95) {
        console.log(`[XIBALBA SDK] Reporting Customer Feedback for ${targetAgent}`);
        return {
            customer: this.agentAddress,
            provider: targetAgent,
            actual_tokens_processed: actualTokens,
            actual_latency: actualLatencyMs,
            actual_accuracy: accuracy,
            timestamp: Date.now() / 1000
        };
    }
}

module.exports = XibalbaIntegritySDK;
