// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ReputationSBT is ERC721, Ownable {
    using Strings for uint256;
    using Strings for uint8;
    
    uint256 private _nextTokenId;

    struct ReputationMetrics {
        uint8 accuracy;    // Cognitive clinical precision (0-100)
        uint8 compliance;  // HIPAA regulatory and ZK boundary adherence (0-100)
        uint8 reliability; // Latency and uptime operational verification (0-100)
        uint32 lastUpdated;
    }

    mapping(uint256 => ReputationMetrics) public agentMetrics;

    event MetricsUpdated(uint256 indexed tokenId, uint8 accuracy, uint8 compliance, uint8 reliability, uint32 lastUpdated);

    constructor() ERC721("ReputationSBT", "RSBT") Ownable(msg.sender) {}

    function mint(address to, uint8 accuracy, uint8 compliance, uint8 reliability) external onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        agentMetrics[tokenId] = ReputationMetrics({
            accuracy: accuracy,
            compliance: compliance,
            reliability: reliability,
            lastUpdated: uint32(block.timestamp)
        });
        emit MetricsUpdated(tokenId, accuracy, compliance, reliability, uint32(block.timestamp));
    }

    function updateMetrics(uint256 tokenId, uint8 accuracy, uint8 compliance, uint8 reliability) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        agentMetrics[tokenId] = ReputationMetrics({
            accuracy: accuracy,
            compliance: compliance,
            reliability: reliability,
            lastUpdated: uint32(block.timestamp)
        });
        emit MetricsUpdated(tokenId, accuracy, compliance, reliability, uint32(block.timestamp));
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        ReputationMetrics memory metrics = agentMetrics[tokenId];

        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            '{"name": "Xibalba Agent Reputation #', tokenId.toString(),
            '", "description": "Soulbound Token tracking clinical AI performance metrics.", ',
            '"attributes": [',
                '{"trait_type": "Accuracy", "value": ', uint256(metrics.accuracy).toString(), '}, ',
                '{"trait_type": "Compliance", "value": ', uint256(metrics.compliance).toString(), '}, ',
                '{"trait_type": "Reliability", "value": ', uint256(metrics.reliability).toString(), '}, ',
                '{"trait_type": "Last Updated", "display_type": "date", "value": ', uint256(metrics.lastUpdated).toString(), '}',
            ']}'
        ))));

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    // SBT logic: Non-transferable
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "SBT: Transfer not allowed");
        return super._update(to, tokenId, auth);
    }
}
