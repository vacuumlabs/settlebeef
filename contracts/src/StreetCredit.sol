// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract StreetCredit {
    enum Vote {
        Correct,
        Incorrect,
        Abstain
    }

    mapping(address => int256) public streetCredit;
    mapping(address => bool) public canUpdateStreetCredit;

    error StreetCreditTransferForbidden();

    modifier onlyAuthorised() {
        if (!canUpdateStreetCredit[msg.sender]) {
            revert StreetCreditTransferForbidden();
        }
        _;
    }

    function updateStreetCredit(Vote[] memory votes, address[] memory to) public onlyAuthorised {
        for (uint256 i; i < to.length;) {
            if (votes[i] == Vote.Correct) {
                streetCredit[to[i]] += 1;
            } else if (votes[i] == Vote.Incorrect) {
                streetCredit[to[i]] -= 10;
            }
            unchecked {
                ++i;
            }
        }
    }
}
