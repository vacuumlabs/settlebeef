// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {Beef} from "./Beef.sol";
import {StreetCredit} from "./StreetCredit.sol";

// @notice Factory contract for creating Beef contracts. User entrypoint in Settlebeef.
contract Slaughterhouse is StreetCredit {
    // @notice The implementation address for Beef contract
    address public beefImplementation;
    // @notice The list of all beefs
    address[] public beefs;
    // @notice The address of Wrapped ETH
    address public WETH;
    // @notice The address of Wrapped Staked ETH
    address public WSTETH;
    // @notice The address of Uniswap V2 Router (for swapping WETH/WSTETH)
    address public uniswapV2Router;

    event BeefPackaged(address indexed beef, address indexed owner, address indexed foe);

    constructor(address _weth, address _wsteth, address _uniswapV2Router) {
        beefImplementation = address(new Beef());
        WETH = _weth;
        WSTETH = _wsteth;
        uniswapV2Router = _uniswapV2Router;
    }

    // @notice Get all beefs
    function getBeefs() public view returns (address[] memory) {
        return beefs;
    }

    // @notice Start a new beef
    // @param params The parameters for the beef
    // @param amountOutMin The minimum amount of WSTETH to receive from the beef, if staking enabled
    function packageBeef(Beef.ConstructorParams memory params, uint256 amountOutMin)
        public
        payable
        returns (address payable)
    {
        address payable beef = payable(Clones.clone(beefImplementation));
        Beef(beef).initialize{value: msg.value}(params, amountOutMin, WETH, WSTETH, uniswapV2Router, address(this));
        beefs.push(beef);
        canUpdateStreetCredit[beef] = true;
        emit BeefPackaged(beef, params.owner, params.foe);
        return beef;
    }
}
