// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/oracle/CCIPReputationBridge.sol";
import "../src/oracle/ReputationRegistry.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock", "MOCK") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MockRegistry {
    function getAgent(address) external pure returns (uint256, uint256, bool, uint256) {
        return (800, 0, true, 2);
    }
    
    uint256 public updatedAis;
    function updateAISByBridge(address, uint256 _ais, uint256) external {
        updatedAis = _ais;
    }
}

contract MockRegistryNoRep {
    function getAgent(address) external pure returns (uint256, uint256, bool, uint256) {
        return (0, 0, false, 0);
    }
}

/**
 * @dev A proper mock router that implements IRouterClient to avoid
 *      the Foundry mockCall prefix-matching issue with empty-code addresses.
 *      Returned fee and messageId are configurable per test.
 */
contract MockRouter {
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

    function isChainSupported(uint64) external pure returns (bool) { return true; }

    // Allow receiving ETH for native-fee tests
    receive() external payable {}
}

contract CCIPReputationBridgeTest is Test {
    CCIPReputationBridge bridge;
    MockRegistry registry;
    MockToken token;
    MockRouter mockRouter;
    address owner = address(this);
    address agent = address(0x111);

    function setUp() public {
        registry = new MockRegistry();
        token = new MockToken();
        mockRouter = new MockRouter();
        bridge = new CCIPReputationBridge(address(mockRouter), address(registry));
    }

    function testSetTrustedBridge() public {
        bridge.setTrustedBridge(1, address(0x222));
        assertEq(bridge.trustedBridges(1), address(0x222));
    }

    function testBridgeReputationNativeFee() public {
        bridge.setTrustedBridge(1, address(0x222));

        mockRouter.setFee(1e15);
        mockRouter.setMsgId(keccak256("msgId"));

        vm.deal(owner, 1 ether);
        bytes32 msgId = bridge.bridgeReputation{value: 1e15}(1, agent, address(0));
        assertEq(msgId, keccak256("msgId"));
    }

    function testBridgeReputationERC20Fee() public {
        bridge.setTrustedBridge(1, address(0x222));

        mockRouter.setFee(100);
        mockRouter.setMsgId(keccak256("msgId"));

        token.mint(owner, 1000);
        token.approve(address(bridge), 100);

        bytes32 msgId = bridge.bridgeReputation(1, agent, address(token));
        assertEq(msgId, keccak256("msgId"));
    }

    function testBridgeReputationNoRep() public {
        MockRegistryNoRep r2 = new MockRegistryNoRep();
        CCIPReputationBridge bridge2 = new CCIPReputationBridge(address(mockRouter), address(r2));

        vm.expectRevert("No reputation score to bridge");
        bridge2.bridgeReputation(1, agent, address(0));
    }

    function testBridgeReputationNoBridge() public {
        vm.expectRevert("Destination bridge not configured");
        bridge.bridgeReputation(1, agent, address(0));
    }

    function testBridgeReputationInsufficientFee() public {
        bridge.setTrustedBridge(1, address(0x222));
        mockRouter.setFee(1e15);

        vm.deal(owner, 1 ether);
        vm.expectRevert("Insufficient fee provided");
        bridge.bridgeReputation{value: 1e14}(1, agent, address(0));
    }

    function testCcipReceive() public {
        bridge.setTrustedBridge(1, address(0x555)); 
        
        Client.Any2EVMMessage memory message;
        message.sourceChainSelector = 1;
        message.sender = abi.encode(address(0x555));
        message.data = abi.encode(agent, 900, 3);
        message.messageId = keccak256("msgId");

        vm.prank(address(mockRouter));
        bridge.ccipReceive(message);

        assertEq(registry.updatedAis(), 900);
    }

    function testCcipReceiveNotTrusted() public {
        bridge.setTrustedBridge(1, address(0x555)); 
        
        Client.Any2EVMMessage memory message;
        message.sourceChainSelector = 1;
        message.sender = abi.encode(address(0x666)); 
        message.data = abi.encode(agent, 900, 3);

        vm.prank(address(mockRouter));
        vm.expectRevert("Sender not trusted");
        bridge.ccipReceive(message);
    }
}
