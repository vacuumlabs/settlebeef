// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {Beef} from "../src/Beef.sol";
import {Slaughterhouse} from "../src/Slaughterhouse.sol";

contract BeefTest is Test {
    Beef public beef;
    address[] public arbiters = new address[](3);
    address payable public slaughterhouse;
    address public beefOwner = address(10);
    address public challenger = address(1);

    function setUp() public {
        slaughterhouse = payable(new Slaughterhouse(address(11), address(12), address(13), address(14), 200, 300));

        arbiters[0] = makeAddr("alice");
        arbiters[1] = makeAddr("bob");
        arbiters[2] = makeAddr("charlie");
        Beef.ConstructorParams memory params = Beef.ConstructorParams({
            owner: beefOwner,
            wager: 1000,
            challenger: challenger,
            settleStart: block.timestamp + 30 days,
            title: "Test Beef",
            description: "This is a test beef.",
            arbiters: arbiters,
            joinDeadline: block.timestamp + 7 days,
            staking: false
        });
        Beef beefImpl = new Beef();
        beef = Beef(payable(Clones.clone(address(beefImpl))));

        vm.prank(beefOwner);
        vm.deal(beefOwner, params.wager);

        // 2% Protocol, 3% Arbiters rewards
        beef.initialize{value: params.wager}(params, 0, address(0), address(0), address(0), slaughterhouse, 200, 300);
    }

    function test_arbiterAttend_reverts_ifAlreadyAttended() public {
        vm.startPrank(arbiters[0]);
        beef.arbiterAttend();
        vm.expectRevert(abi.encodeWithSelector(Beef.BeefArbiterAlreadyAttended.selector, arbiters[0]));
        beef.arbiterAttend();
    }

    function testRewardsDistribution() public {
        vm.startPrank(arbiters[0]);
        beef.arbiterAttend();
        vm.startPrank(arbiters[1]);
        beef.arbiterAttend();
        vm.startPrank(arbiters[2]);
        beef.arbiterAttend();

        vm.startPrank(challenger);
        vm.deal(challenger, 1000);

        beef.joinBeef{value: 1000}(0);

        // Warp to settleStart
        vm.warp(block.timestamp + 31 days);

        vm.startPrank(arbiters[0]);
        beef.settleBeef(true);
        vm.startPrank(arbiters[1]);
        beef.settleBeef(false);
        vm.startPrank(arbiters[2]);
        beef.settleBeef(true);

        // Beef owner won the challenge
        vm.startPrank(beefOwner);
        beef.serveBeef(0);

        assertEq(arbiters[0].balance, 20);
        // Voted 'incorrectly'
        assertEq(arbiters[1].balance, 0);
        assertEq(arbiters[2].balance, 20);
        // Base reward + 1 arbiter reward for incorrect voting
        assertEq(slaughterhouse.balance, 60);

        // Original wager + challenger wager - arbitersRewards - protocolRewards
        assertEq(beefOwner.balance, 1900);
    }
}
