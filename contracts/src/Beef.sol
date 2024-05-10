// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {Address} from "openzeppelin-contracts/contracts/utils/Address.sol";

contract Beef is Ownable {
    using Address for address;

    struct ConstructorParams {
        address owner;
        uint256 wager;
        address foe;
        uint256 duration;
        string title;
        string description;
    }

    uint256 constant arbiteringDuration = 30 days;

    address public foe;
    address[] public arbiters;
    uint256 public wager;
    uint256 public duration;
    uint256 public deadline;
    string public bet;
    int256 public result;
    uint256 public settleCount;
    string public title;
    string public description;
    mapping(address => bool) public hasSettled;

    error BeefArbiterAlreadySettled(address sender);
    error BeefInvalidWager(uint256 declaredWager, uint256 providedWager);
    error BeefIsRaw(uint256 deadline, uint256 timestamp);
    error BeefIsCooking();
    error BeefIsRotten(uint256 deadline, uint256 timestamp);
    error BeefNotArbiter(address sender);
    error BeefNotFoe(address declaredFoe, address sender);
    error BeefNotRaw();
    error BeefNotRotten(uint256 deadline, uint256 timestamp);
    error BeefNotSettled(uint256 settleCount, uint256 requiredSettleCount);

    modifier onlyArbiter() {
        bool isArbiter;
        for (uint256 i = 0; i < arbiters.length; i++) {
            if (msg.sender == arbiters[i]) {
                isArbiter = true;
                break;
            }
        }
        if (!isArbiter) {
            revert BeefNotArbiter(msg.sender);
        }
        _;
    }

    modifier onlyFoe() {
        if (msg.sender != foe) {
            revert BeefNotFoe(foe, msg.sender);
        }
        _;
    }

    modifier isRaw() {
        if (deadline != 0) {
            revert BeefNotRaw();
        }
        _;
    }

    constructor(ConstructorParams memory params) payable Ownable(params.owner) {
        (wager, foe, duration, title, description) =
            (params.wager, params.foe, params.duration, params.title, params.description);
        if (msg.value != wager) {
            revert BeefInvalidWager(wager, msg.value);
        }
    }

    // @notice Owner can set the arbiters, if beef is still raw.
    function setArbiters(address[] memory _arbiters) public onlyOwner isRaw {
        arbiters = _arbiters;
    }

    // @notice Foe can join the beef, paying the wager.
    function joinBeef() public payable onlyFoe isRaw {
        if (msg.value != wager) {
            revert BeefInvalidWager(wager, msg.value);
        }
        deadline = block.timestamp + duration;
    }

    // @notice Arbiter can settle the beef.
    // @param verdict True if outcome is according to the description, false otherwise.
    function settleBeef(bool verdict) public onlyArbiter {
        if (block.timestamp < deadline) {
            revert BeefIsRaw(deadline, block.timestamp);
        }
        if (block.timestamp > deadline + arbiteringDuration) {
            revert BeefIsRotten(deadline + arbiteringDuration, block.timestamp);
        }
        if (hasSettled[msg.sender]) {
            revert BeefArbiterAlreadySettled(msg.sender);
        }
        result += verdict ? int256(1) : int256(-1);
        ++settleCount;
        hasSettled[msg.sender] = true;
    }

    // @notice Serve the beef to the winner.
    function serveBeef() public {
        if (settleCount <= arbiters.length / 2) {
            revert BeefNotSettled(settleCount, arbiters.length / 2);
        }
        // If majority has settled, result should never be 0.
        assert(result != 0);
        if (result > 0) {
            payable(owner()).transfer(address(this).balance);
        } else {
            payable(foe).transfer(address(this).balance);
        }
    }

    // @notice Withdraw the wagers if beef had rotten.
    function withdraw() public {
        if (block.timestamp < deadline + arbiteringDuration) {
            revert BeefNotRotten(deadline + arbiteringDuration, block.timestamp);
        }
        payable(owner()).transfer(address(this).balance / 2);
        payable(foe).transfer(address(this).balance / 2);
    }
}
