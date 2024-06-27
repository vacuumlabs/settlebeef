// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";

import '@uniswap/v3-periphery/contracts/interfaces/IQuoterV2.sol';

contract TestQuote is Script {
    function setUp() public {}

    function run() public {
        address WETH = vm.envAddress("WETH_ADDRESS");
        address WSTETH = vm.envAddress("WSTETH_ADDRESS");
        vm.broadcast();

        address qa = address(0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a);
        IQuoterV2.QuoteExactInputSingleParams memory params = IQuoterV2.QuoteExactInputSingleParams({
            tokenIn: WETH,
            tokenOut: WSTETH,
            fee: 100,
            amountIn: 1 ether,
            sqrtPriceLimitX96: 0
        });
        uint amountOut;
        (amountOut,,,) = IQuoterV2(qa).quoteExactInputSingle(params);

        console2.log("Quote: ", amountOut);
    }
}
