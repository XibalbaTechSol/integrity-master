use sha2::{Digest, Sha256};

pub struct MerkleTree {
    pub leaves: Vec<[u8; 32]>,
    pub tree: Vec<Vec<[u8; 32]>>,
}

impl MerkleTree {
    pub fn new(leaves: Vec<[u8; 32]>) -> Self {
        let mut tree = vec![leaves.clone()];
        let mut current_level = leaves;

        while current_level.len() > 1 {
            let mut next_level = Vec::new();
            for chunk in current_level.chunks(2) {
                if chunk.len() == 2 {
                    next_level.push(Self::hash_nodes(&chunk[0], &chunk[1]));
                } else {
                    // Duplicate last odd node
                    next_level.push(Self::hash_nodes(&chunk[0], &chunk[0]));
                }
            }
            tree.push(next_level.clone());
            current_level = next_level;
        }

        Self {
            leaves: tree[0].clone(),
            tree,
        }
    }

    pub fn get_root(&self) -> [u8; 32] {
        self.tree.last().map(|level| level[0]).unwrap_or([0u8; 32])
    }

    pub fn get_proof(&self, index: usize) -> Vec<[u8; 32]> {
        let mut proof = Vec::new();
        let mut idx = index;

        for level in 0..self.tree.len() - 1 {
            let sibling_idx = if idx % 2 == 0 { idx + 1 } else { idx - 1 };
            if sibling_idx < self.tree[level].len() {
                proof.push(self.tree[level][sibling_idx]);
            } else {
                proof.push(self.tree[level][idx]);
            }
            idx /= 2;
        }
        proof
    }

    fn hash_nodes(left: &[u8; 32], right: &[u8; 32]) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(left);
        hasher.update(right);
        hasher.finalize().into()
    }
}
include!("merkle_tests.rs");
