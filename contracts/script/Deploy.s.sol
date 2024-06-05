// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";

import {Slaughterhouse} from "../src/Slaughterhouse.sol";

contract Deploy is Script {
    function setUp() public {}

    function run() public {
        address WETH = vm.envAddress("WETH_ADDRESS");
        address WSTETH = vm.envAddress("WSTETH_ADDRESS");
        address uniswapV2Router = vm.envAddress("UNIV2ROUTER_ADDRESS");
        address initialOwner = vm.envAddress("CONTRACT_OWNER_ADDRESS");
        uint256 protocolRewardBasisPoints = vm.envUint("PROTOCOL_REWARD_BASIS_POINTS");
        uint256 arbitersRewardBasisPoints = vm.envUint("ARBITERS_REWARD_BASIS_POINTS");
        vm.broadcast();

        Slaughterhouse slaughterhouse = new Slaughterhouse(
            WETH,
            WSTETH,
            uniswapV2Router,
            initialOwner,
            protocolRewardBasisPoints,
            arbitersRewardBasisPoints
        );

        console2.log("Slaughterhouse:", address(slaughterhouse));
        console2.log("Beef implementation:", slaughterhouse.beefImplementation());
    }
}
