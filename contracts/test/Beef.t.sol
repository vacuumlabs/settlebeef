// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Beef} from "../src/Beef.sol";

contract BeefTest is Test {
    Beef public beef;

    function setUp() public {
        address[] memory arbiters = new address[](0);
        Beef.ConstructorParams memory params = Beef.ConstructorParams({
            owner: address(this),
            wager: 1000,
            foe: address(0),
            duration: 30 days,
            title: "Test Beef",
            description: "This is a test beef.",
            arbiters: arbiters
        });
        beef = new Beef(params);
    }
}
