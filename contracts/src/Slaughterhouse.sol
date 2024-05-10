// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {Beef} from "./Beef.sol";

contract Slaughterhouse {
    address public beefImplementation;
    address[] public beefs;

    event BeefPackaged(address indexed beef, address indexed owner, address indexed foe);

    constructor() {
        beefImplementation = address(new Beef());
    }

    function packageBeef(Beef.ConstructorParams memory params) public payable returns (address) {
        address beef = Clones.clone(beefImplementation);
        Beef(beef).initialize{value: msg.value}(params);
        beefs.push(beef);
        emit BeefPackaged(beef, params.owner, params.foe);
        return beef;
    }
}
