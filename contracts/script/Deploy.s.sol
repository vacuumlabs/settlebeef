// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";

import {Slaughterhouse} from "../src/Slaughterhouse.sol";

contract Deploy is Script {
    function setUp() public {}

    function run() public {
        vm.broadcast();

        Slaughterhouse slaughterhouse = new Slaughterhouse();
        console2.log("Slaughterhouse:", address(slaughterhouse));
    }
}
