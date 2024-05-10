// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {Beef} from "./Beef.sol";

contract Slaughterhouse {
    address public beefImplementation;

    event BeefPackaged(address beef);

    constructor() {
        beefImplementation = address(new Beef());
    }

    function packageBeef(Beef.ConstructorParams memory params) public payable returns (address) {
        address clone = Clones.clone(beefImplementation);
        Beef(clone).initialize{value: msg.value}(params);
        emit BeefPackaged(clone);
        return clone;
    }
}
