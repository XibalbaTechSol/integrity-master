// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/oracle/ReputationRegistry.sol";
import "../src/oracle/IntegrityToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";

contract MockLink is ERC20 {
    constructor() ERC20("LINK", "LINK") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @dev Deployed mock router to avoid vm.mockCall prefix-match issues with empty-code addresses.
 */
contract MockCCIPRouter {
    uint256 public mockFee;
    bytes32 public mockMsgId;

    function setFee(uint256 _fee) external { mockFee = _fee; }
    function setMsgId(bytes32 _id) external { mockMsgId = _id; }

    function getFee(
        uint64,
        Client.EVM2AnyMessage memory
    ) external view returns (uint256) {
        return mockFee;
    }

    function ccipSend(
        uint64,
        Client.EVM2AnyMessage calldata
    ) external payable returns (bytes32) {
        return mockMsgId;
    }

    receive() external payable {}
}

contract ReputationRegistryTest is Test {
    ReputationRegistry registry;
    IntegrityToken token;
    MockLink link;
    MockCCIPRouter mockRouter;
    
    address admin = address(this);
    address validator = address(0x123);
    address bridge = address(0x456);
    address agent = address(0x111);
    address user = address(0x222);

    address stateAnchor = address(0x888);
    address verifier = address(0x777);

    function setUp() public {
        token = new IntegrityToken(admin);
        link = new MockLink();
        mockRouter = new MockCCIPRouter();

        registry = new ReputationRegistry(address(token), admin);
        registry.grantRole(registry.VALIDATOR_ROLE(), validator);
        registry.grantRole(registry.BRIDGE_ROLE(), bridge);
        
        registry.setCCIPConfig(address(mockRouter), address(link));
        registry.setZKConfigs(stateAnchor, verifier);
        registry.setIdentityRegistry(address(0x666));
    }

    function testSetIdentityRegistry() public {
        assertEq(registry.identityRegistry(), address(0x666));
        vm.expectRevert();
        vm.prank(user);
        registry.setIdentityRegistry(user);
    }

    function testSetZKConfigs() public {
        assertEq(registry.stateAnchor(), stateAnchor);
        assertEq(registry.zkVerifier(), verifier);
    }

    function testRequestValidation() public {
        bytes32 hash = registry.requestValidation(validator, agent, "ipfs://test");
        assertTrue(registry.pendingValidations(hash));
    }

    function testRecordValidation() public {
        bytes32 hash = registry.requestValidation(validator, agent, "ipfs://test");
        
        vm.prank(validator);
        registry.recordValidation(hash, 1, "ipfs://response");
        
        assertFalse(registry.pendingValidations(hash));
    }

    function testRecordValidationNotPending() public {
        vm.prank(validator);
        vm.expectRevert("Invalid or already processed request.");
        registry.recordValidation(keccak256("test"), 1, "ipfs://response");
    }

    function testVerifyReputationZK() public {
        // Pre-set AIS to 300 so the +50 ZK boost lands at 350, within the 300-1000 valid range
        vm.prank(validator);
        registry.updateAIS(agent, 300, 1);

        vm.mockCall(verifier, abi.encodeWithSignature("verify(bytes,bytes32[])"), abi.encode(true));
        
        bytes32[] memory inputs = new bytes32[](4);
        inputs[0] = bytes32(0);
        inputs[1] = bytes32(0);
        inputs[2] = bytes32(uint256(uint160(agent)));
        inputs[3] = keccak256("state");

        vm.prank(agent);
        registry.verifyReputationZK("proof", inputs);

        (uint256 score, , , ) = registry.getAgent(agent);
        assertEq(score, 350); 
    }

    function testVerifyReputationZKNotAgent() public {
        bytes32[] memory inputs = new bytes32[](4);
        inputs[2] = bytes32(uint256(uint160(agent)));

        vm.expectRevert("Only the agent can submit their own ZK-proof.");
        registry.verifyReputationZK("proof", inputs);
    }

    function testVerifyReputationZKInvalidProof() public {
        vm.mockCall(verifier, abi.encodeWithSignature("verify(bytes,bytes32[])"), abi.encode(false));
        
        bytes32[] memory inputs = new bytes32[](4);
        inputs[2] = bytes32(uint256(uint160(agent)));

        vm.prank(agent);
        vm.expectRevert("Invalid ZK Proof: Mathematical constraint failure.");
        registry.verifyReputationZK("proof", inputs);
    }

    function testUpdateAIS() public {
        vm.prank(validator);
        registry.updateAIS(agent, 800, 2);

        (uint256 score, , , uint256 tier) = registry.getAgent(agent);
        assertEq(score, 800);
        assertEq(tier, 2);
    }

    function testUpdateAISInvalidScore() public {
        vm.prank(validator);
        vm.expectRevert("AIS out of valid range.");
        registry.updateAIS(agent, 200, 2);

        vm.prank(validator);
        vm.expectRevert("Invalid tier.");
        registry.updateAIS(agent, 800, 4);
    }

    function testUpdateAISByBridge() public {
        vm.prank(bridge);
        registry.updateAISByBridge(agent, 900, 3);
        
        (uint256 score, , , ) = registry.getAgent(agent);
        assertEq(score, 900);
    }

    function testBroadcastAISToEthereumL1() public {
        vm.prank(validator);
        registry.updateAIS(agent, 800, 2);

        link.mint(address(registry), 10e18);

        // Configure deployed mock router directly -- avoids selector-prefix matching issues
        mockRouter.setFee(1e18);
        mockRouter.setMsgId(keccak256("msgId"));

        bytes32 msgId = registry.broadcastAISToEthereumL1(agent, 1, address(0x123));
        assertEq(msgId, keccak256("msgId"));
    }

    function testBroadcastAISToEthereumL1NoScore() public {
        vm.expectRevert("Agent has no AIS score to broadcast.");
        registry.broadcastAISToEthereumL1(agent, 1, address(0x123));
    }

    function testBroadcastAISToEthereumL1NoLink() public {
        vm.prank(validator);
        registry.updateAIS(agent, 800, 2);

        // Router will return a fee greater than the registry's LINK balance (zero)
        mockRouter.setFee(1e18);
        
        vm.expectRevert("Not enough LINK balance to cover CCIP fees.");
        registry.broadcastAISToEthereumL1(agent, 1, address(0x123));
    }

    function testStake() public {
        token.mint(agent, 1000);
        
        vm.startPrank(agent);
        token.approve(address(registry), 500);
        registry.stake(500);
        vm.stopPrank();

        (, uint256 staked, , ) = registry.getAgent(agent);
        assertEq(staked, 500);
    }

    function testStakeZero() public {
        vm.expectRevert("Amount must be greater than zero.");
        registry.stake(0);
    }

    function testStakeToAgent() public {
        token.mint(user, 1000);

        vm.startPrank(user);
        token.approve(address(registry), 500);
        registry.stakeToAgent(agent, 500);
        vm.stopPrank();

        assertEq(registry.userStakes(user, agent), 500);
    }

    function testStakeToAgentZero() public {
        vm.expectRevert("Amount must be greater than zero.");
        registry.stakeToAgent(agent, 0);
    }

    function testUnstakeFromAgent() public {
        token.mint(user, 1000);

        vm.startPrank(user);
        token.approve(address(registry), 500);
        registry.stakeToAgent(agent, 500);
        registry.unstakeFromAgent(agent, 200);
        vm.stopPrank();

        assertEq(registry.userStakes(user, agent), 300);
        // IntegrityToken charges 0.5% fee on transfers (not from/to contract/owner/zero).
        // unstakeFromAgent transfers 200 tokens: fee = floor(200 * 50 / 10000) = 1
        // User receives 199. Balance: 1000 - 500 (staked) + 199 (unstaked) = 699
        assertEq(token.balanceOf(user), 699);
    }

    function testUnstakeFromAgentZeroOrExceed() public {
        vm.startPrank(user);
        vm.expectRevert("Amount must be greater than zero.");
        registry.unstakeFromAgent(agent, 0);

        vm.expectRevert("Insufficient staked balance.");
        registry.unstakeFromAgent(agent, 100);
        vm.stopPrank();
    }

    function testUnstake() public {
        token.mint(agent, 1000);
        
        vm.startPrank(agent);
        token.approve(address(registry), 500);
        registry.stake(500);
        registry.unstake(200);
        vm.stopPrank();

        (, uint256 staked, , ) = registry.getAgent(agent);
        assertEq(staked, 300);
    }

    function testUnstakeZeroOrExceed() public {
        vm.startPrank(agent);
        vm.expectRevert("Amount must be greater than zero.");
        registry.unstake(0);

        vm.expectRevert("Insufficient staked balance.");
        registry.unstake(100);
        vm.stopPrank();
    }

    function testVerifyAgent() public {
        vm.prank(validator);
        registry.verifyAgent(agent, true, 2);

        (, , bool verified, uint256 tier) = registry.getAgent(agent);
        assertTrue(verified);
        assertEq(tier, 2);
    }

    function testUpgradeTier() public {
        token.mint(agent, 1000);
        
        vm.startPrank(agent);
        token.approve(address(registry), 500);
        registry.upgradeTier(2, 500); 
        vm.stopPrank();
    }

    function testUpgradeTierInvalid() public {
        vm.prank(validator);
        registry.verifyAgent(agent, true, 3); 

        vm.startPrank(agent);
        vm.expectRevert("Cannot downgrade or stay at same tier.");
        registry.upgradeTier(2, 500);

        vm.expectRevert("Invalid target tier.");
        registry.upgradeTier(4, 500);
        vm.stopPrank();
    }

}
