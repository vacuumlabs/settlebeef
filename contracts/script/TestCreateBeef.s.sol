// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";

import {Slaughterhouse} from "../src/Slaughterhouse.sol";
import {Beef} from "../src/Beef.sol";

contract Deploy is Script {
    function setUp() public {}

    function run() public {
        address WETH = vm.envAddress("WETH_ADDRESS");
        address WSTETH = vm.envAddress("WSTETH_ADDRESS");
        address uniswapRouter = vm.envAddress("UNIROUTER_ADDRESS");
        address initialOwner = vm.envAddress("CONTRACT_OWNER_ADDRESS");
        uint256 protocolRewardBasisPoints = vm.envUint("PROTOCOL_REWARD_BASIS_POINTS");
        uint256 arbitersRewardBasisPoints = vm.envUint("ARBITERS_REWARD_BASIS_POINTS");
        vm.broadcast();

        address[] memory arbitersArray = new address[](3);
        arbitersArray[0] = address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        arbitersArray[1] = address(0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65);
        arbitersArray[2] = address(0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc);
        Beef.ConstructorParams memory params = Beef.ConstructorParams({
                owner: address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266),
                wager: 1 ether,
                challenger: address(0x90F79bf6EB2c4f870365E785982E1f101E93b906),
                settleStart: block.timestamp + 1 hours,
                joinDeadline: block.timestamp + 1 days,
                staking: true,
                title: "test",
                description: "test2",
                arbiters: arbitersArray
            });
address payable slaughterhouse = payable(0x457cCf29090fe5A24c19c1bc95F492168C0EaFdb);
        Slaughterhouse(slaughterhouse).packageBeef{value: 1 ether}(params, 0.1 ether);
    }
}
