#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_orderbook_matching() {
        let mut ob = Orderbook::new();

        // Bid: Wants min AIS 800, Price 100
        ob.insert_bid(Bid {
            bid_id: "bid1".to_string(),
            requester: "user1".to_string(),
            price_per_k_tokens: 100,
            min_ais: 800,
            token_allocation: 1000,
        });

        // Ask 1: AIS 700 (Too low), Price 90
        ob.insert_ask(Ask {
            ask_id: "ask1".to_string(),
            agent_address: "agent1".to_string(),
            price_per_k_tokens: 90,
            current_ais: 700,
            available_tokens: 1000,
        });

        // Ask 2: AIS 850 (Qualified), Price 95
        ob.insert_ask(Ask {
            ask_id: "ask2".to_string(),
            agent_address: "agent2".to_string(),
            price_per_k_tokens: 95,
            current_ais: 850,
            available_tokens: 500,
        });

        let matches = ob.match_orders();

        assert_eq!(matches.len(), 1);
        let (bid, ask, tokens) = &matches[0];
        assert_eq!(bid.bid_id, "bid1");
        assert_eq!(ask.ask_id, "ask2");
        assert_eq!(*tokens, 500);
        
        // Check remaining token allocation in bid
        // Note: match_orders currently returns the matches but we might need to check the state if we want to verify partial fills fully.
        // In the current implementation, it updates the internal state.
    }

    #[test]
    fn test_orderbook_no_match_spread() {
        let mut ob = Orderbook::new();

        // Bid: Price 90
        ob.insert_bid(Bid {
            bid_id: "bid1".to_string(),
            requester: "user1".to_string(),
            price_per_k_tokens: 90,
            min_ais: 500,
            token_allocation: 1000,
        });

        // Ask: Price 100 (Too high)
        ob.insert_ask(Ask {
            ask_id: "ask1".to_string(),
            agent_address: "agent1".to_string(),
            price_per_k_tokens: 100,
            current_ais: 900,
            available_tokens: 1000,
        });

        let matches = ob.match_orders();
        assert_eq!(matches.len(), 0);
    }
}
