use std::collections::BTreeMap;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Bid {
    pub bid_id: String,
    pub requester: String,
    pub price_per_k_tokens: u64, // In USDC micro-units (6 decimals)
    pub min_ais: u32,
    pub token_allocation: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Ask {
    pub ask_id: String,
    pub agent_address: String,
    pub price_per_k_tokens: u64,
    pub current_ais: u32,
    pub available_tokens: u64,
}

pub struct Orderbook {
    // Bids sorted descending by price
    pub bids: BTreeMap<u64, Vec<Bid>>,
    // Asks sorted ascending by price
    pub asks: BTreeMap<u64, Vec<Ask>>,
}

impl Orderbook {
    pub fn new() -> Self {
        Self {
            bids: BTreeMap::new(),
            asks: BTreeMap::new(),
        }
    }

    pub fn insert_bid(&mut self, bid: Bid) {
        self.bids.entry(bid.price_per_k_tokens)
            .or_insert_with(Vec::new)
            .push(bid);
    }

    pub fn insert_ask(&mut self, ask: Ask) {
        self.asks.entry(ask.price_per_k_tokens)
            .or_insert_with(Vec::new)
            .push(ask);
    }

    /// Match orders considering both price convergence and Agent Integrity (AIS) constraints.
    pub fn match_orders(&mut self) -> Vec<(Bid, Ask, u64)> {
        let mut matches = Vec::new();
        
        let bid_prices: Vec<u64> = self.bids.keys().rev().cloned().collect();
        let ask_prices: Vec<u64> = self.asks.keys().cloned().collect();

        for bid_price in bid_prices {
            for &ask_price in &ask_prices {
                if ask_price > bid_price {
                    break; // No spread convergence
                }

                let bids_at_price = self.bids.get_mut(&bid_price).unwrap();
                let asks_at_price = self.asks.get_mut(&ask_price).unwrap();

                let mut bid_idx = 0;
                while bid_idx < bids_at_price.len() {
                    let mut ask_idx = 0;
                    while ask_idx < asks_at_price.len() {
                        let bid = &bids_at_price[bid_idx];
                        let ask = &asks_at_price[ask_idx];

                        // AIS Constraint Validation
                        if ask.current_ais >= bid.min_ais {
                            let match_tokens = bid.token_allocation.min(ask.available_tokens);
                            matches.push((bid.clone(), ask.clone(), match_tokens));

                            // Update balances
                            bids_at_price[bid_idx].token_allocation -= match_tokens;
                            asks_at_price[ask_idx].available_tokens -= match_tokens;

                            if asks_at_price[ask_idx].available_tokens == 0 {
                                asks_at_price.remove(ask_idx);
                                continue;
                            }
                        }
                        ask_idx += 1;
                    }
                    if bids_at_price[bid_idx].token_allocation == 0 {
                        bids_at_price.remove(bid_idx);
                        continue;
                    }
                    bid_idx += 1;
                }
            }
        }
        matches
    }
}

