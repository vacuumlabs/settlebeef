// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";

import {Beef} from "../src/Beef.sol";
import {Slaughterhouse} from "../src/Slaughterhouse.sol";

contract SlaughterhouseTest is Test {
    Slaughterhouse public slaughterhouse;

    function setUp() public {
        slaughterhouse = new Slaughterhouse();
    }

    function test_packageBeef_packagesBeef() public {
        address[] memory arbiters = new address[](3);
        arbiters[0] = address(0x1);
        arbiters[1] = address(0x2);
        arbiters[2] = address(0x3);
        Beef.ConstructorParams memory params = Beef.ConstructorParams({
            owner: address(this),
            wager: 1000,
            foe: address(0),
            settleStart: block.timestamp + 30 days,
            title: "Test Beef",
            description: "This is a test beef.",
            arbiters: arbiters
        });
        Beef beef = Beef(slaughterhouse.packageBeef{value: params.wager}(params));
        assertTrue(address(beef) != address(0), "Beef not packaged");
        assertEq(beef.owner(), params.owner, "Beef owner mismatch");
        assertEq(beef.wager(), params.wager, "Beef wager mismatch");
        assertEq(beef.foe(), params.foe, "Beef foe mismatch");
        assertEq(beef.settleStart(), params.settleStart, "Beef settleStart mismatch");
        assertEq(beef.title(), params.title, "Beef title mismatch");
        assertEq(beef.description(), params.description, "Beef description mismatch");
    }
}
