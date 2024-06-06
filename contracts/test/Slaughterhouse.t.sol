// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";

import {Beef} from "../src/Beef.sol";
import {Slaughterhouse} from "../src/Slaughterhouse.sol";

contract SlaughterhouseTest is Test {
    Slaughterhouse public slaughterhouse;
    address public WETH = address(0x1);
    address public WSTETH = address(0x2);
    address public uniswapV2Router = address(0x3);
    address public slaughterhouseOwner = address(5);

    function setUp() public {
        slaughterhouse = new Slaughterhouse(WETH, WSTETH, uniswapV2Router, slaughterhouseOwner, 100, 10);
    }

    function test_packageBeef_packagesBeef() public {
        address[] memory arbiters = new address[](3);
        arbiters[0] = address(0x1);
        arbiters[1] = address(0x2);
        arbiters[2] = address(0x3);
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
        Beef beef = Beef(slaughterhouse.packageBeef{value: params.wager}(params, 0));
        assertTrue(address(beef) != address(0), "Beef not packaged");
        assertEq(beef.owner(), params.owner, "Beef owner mismatch");
        assertEq(beef.wager(), params.wager, "Beef wager mismatch");
        assertEq(beef.challenger(), params.challenger, "Beef challenger mismatch");
        assertEq(beef.settleStart(), params.settleStart, "Beef settleStart mismatch");
        assertEq(beef.title(), params.title, "Beef title mismatch");
        assertEq(beef.description(), params.description, "Beef description mismatch");
        assertEq(beef.arbiters(0), arbiters[0], "Beef arbiter 0 mismatch");
        assertEq(beef.arbiters(1), arbiters[1], "Beef arbiter 1 mismatch");
        assertEq(beef.arbiters(2), arbiters[2], "Beef arbiter 2 mismatch");
        assertEq(beef.joinDeadline(), params.joinDeadline, "Beef joinDeadline mismatch");
        assertEq(beef.staking(), params.staking, "Beef staking mismatch");
        assertEq(address(beef.WETH()), WETH, "Beef WETH mismatch");
        assertEq(address(beef.WSTETH()), WSTETH, "Beef WSTETH mismatch");
        assertEq(address(beef.uniswapV2Router()), uniswapV2Router, "Beef uniswapV2Router mismatch");
        assertEq(beef.protocolRewardBasisPoints(), slaughterhouse.protocolRewardBasisPoints(), "Beef protocolRewardsBasisPoints mismatch");
        assertEq(beef.arbitersRewardBasisPoints(), slaughterhouse.arbitersRewardBasisPoints(), "Beef arbitersRewardsBasisPoints mismatch");
        assertEq(beef.totalBasisPoints(), slaughterhouse.totalBasisPoints(), "Beef totalBasisPoints mismatch");
    }

    function testFuzz_SliceBeef(uint8 from, uint8 to) public {
        vm.assume(to < 50);
        vm.assume(from < to);

        for (uint256 i ;  i < to; ) {
            address[] memory arbiters = new address[](3);
            arbiters[0] = address(0x1);
            arbiters[1] = address(0x2);
            arbiters[2] = address(0x3);
            Beef.ConstructorParams memory params = Beef.ConstructorParams({
                owner: address(this),
            // NOTE: Match the wager with the index for easy assert (i.e. use the wager as Beef ID)
                wager: i,
                challenger: address(0),
                settleStart: block.timestamp + 30 days,
                title: "Test Beef",
                description: "This is a test beef.",
                arbiters: arbiters,
                joinDeadline: block.timestamp + 7 days,
                staking: false
            });
            slaughterhouse.packageBeef{value: params.wager}(params, 0);

            unchecked {++i;}
        }

        console.log(slaughterhouse.getBeefs().length);

        address[] memory slice = slaughterhouse.getBeefsSlice(from, to);

        assertEq(slice[0].balance, from, "Unexpected first element in the slice");
        assertEq(slice[slice.length - 1].balance, to - 1, "Unexpected last element in the slice");
    }
}
