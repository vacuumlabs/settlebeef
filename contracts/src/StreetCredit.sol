// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract StreetCredit {
    mapping(address => int256) public balance;
    mapping(address => boolean) public canUpdate;

    error StreetCreditTransferForbidden();

    modifier onlyAuthorised() { 
        if (!canUpdate[msg.sender]) {
            revert StreetCreditTransferForbidden();
        }
        _;
    }

    function update(boolean increase, address[] memory to) public onlyAuthorised {
        for (uint256 i; i < to.length;) {
            if (increase) {
                balance[to[i]] += 1;
            } else {
                balance[to[i]] -= 10;
            }
            unchecked {
                ++i;
            }
        }
    }
}
