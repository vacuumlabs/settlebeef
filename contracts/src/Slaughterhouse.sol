// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {Beef} from "./Beef.sol";

contract Slaughterhouse {
    address public beefImplementation;
    address[] public beefs;
    address public WETH;
    address public WSTETH;
    address public uniswapV2Router;

    event BeefPackaged(address indexed beef, address indexed owner, address indexed foe);

    constructor(address _weth, address _wsteth, address _uniswapV2Router) {
        beefImplementation = address(new Beef());
        WETH = _weth;
        WSTETH = _wsteth;
        uniswapV2Router = _uniswapV2Router;
    }

    function getBeefs() public view returns (address[] memory) {
        return beefs;
    }

    function packageBeef(Beef.ConstructorParams memory params, uint256 amountOutMin) public payable returns (address) {
        address payable beef = payable(Clones.clone(beefImplementation));
        Beef(beef).initialize{value: msg.value}(params, amountOutMin, WETH, WSTETH, uniswapV2Router);
        beefs.push(beef);
        emit BeefPackaged(beef, params.owner, params.foe);
        return beef;
    }
}
