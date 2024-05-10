// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Beef} from "../src/Beef.sol";

contract BeefTest is Test {
    Beef public beef;

    function setUp() public {
        beef = new Beef(address(this));
    }
}
