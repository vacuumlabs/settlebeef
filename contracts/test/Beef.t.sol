// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

import {Beef} from "../src/Beef.sol";

contract BeefTest is Test {
    Beef public beef;
    address[] arbiters = new address[](3);

    function setUp() public {
        arbiters[0] = makeAddr("alice");
        arbiters[1] = makeAddr("bob");
        arbiters[2] = makeAddr("charlie");
        Beef.ConstructorParams memory params = Beef.ConstructorParams({
            owner: address(this),
            wager: 1000,
            challenger: address(0),
            settleStart: block.timestamp + 30 days,
            title: "Test Beef",
            description: "This is a test beef.",
            arbiters: arbiters,
            joinDeadline: block.timestamp + 7 days,
            staking: false
        });
        Beef beefImpl = new Beef();
        beef = Beef(payable(Clones.clone(address(beefImpl))));
        beef.initialize{value: params.wager}(params, 0, address(0), address(0), address(0), address(0));
    }

    function test_arbiterAttend_reverts_ifAlreadyAttended() public {
        vm.startPrank(arbiters[0]);
        beef.arbiterAttend();
        vm.expectRevert(abi.encodeWithSelector(Beef.BeefArbiterAlreadyAttended.selector, arbiters[0]));
        beef.arbiterAttend();
    }
}
