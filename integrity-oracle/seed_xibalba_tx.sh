#!/bin/bash
for i in {1..10}
do
   tx_hash="0x$(head -c 32 /dev/urandom | xxd -p | tr -d '\n')"
   docker exec integrity-postgres-1 psql -U postgres -d integrity -c "INSERT INTO transaction_logs (agent_id, on_chain_tx_hash, contract_value_intg, staked_amount_intg, success, completion_time_ms, data_quality_score, verified_by_xibalba) VALUES ('88d5ab08-156b-45cf-9b17-32e74a9f2690', '$tx_hash', 100, 500, true, 1000, 0.95, true);"
done
