#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merkle_tree_root() {
        let leaf1 = [1u8; 32];
        let leaf2 = [2u8; 32];
        let leaves = vec![leaf1, leaf2];
        
        let tree = MerkleTree::new(leaves);
        let root = tree.get_root();
        
        // Root should be hash(leaf1 + leaf2)
        let mut hasher = Sha256::new();
        hasher.update(leaf1);
        hasher.update(leaf2);
        let expected_root: [u8; 32] = hasher.finalize().into();
        
        assert_eq!(root, expected_root);
    }

    #[test]
    fn test_merkle_tree_single_leaf() {
        let leaf = [1u8; 32];
        let tree = MerkleTree::new(vec![leaf]);
        assert_eq!(tree.get_root(), leaf);
    }

    #[test]
    fn test_merkle_proof_verification() {
        let leaves = vec![
            [1u8; 32], [2u8; 32], [3u8; 32], [4u8; 32]
        ];
        let tree = MerkleTree::new(leaves.clone());
        let root = tree.get_root();
        
        let index = 2; // leaf [3u8; 32]
        let proof = tree.get_proof(index);
        
        // Verify proof manually
        let mut current_hash = leaves[index];
        let mut idx = index;
        
        for sibling in proof {
            let mut hasher = Sha256::new();
            if idx % 2 == 0 {
                hasher.update(current_hash);
                hasher.update(sibling);
            } else {
                hasher.update(sibling);
                hasher.update(current_hash);
            }
            current_hash = hasher.finalize().into();
            idx /= 2;
        }
        
        assert_eq!(current_hash, root);
    }
}
