// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Beef is OwnableUpgradeable {
    using Address for address;

    struct ConstructorParams {
        address owner;
        uint256 wager;
        address foe;
        uint256 settleStart;
        string title;
        string description;
        address[] arbiters;
    }

    uint256 constant settlingDuration = 30 days;
    uint256 constant joinDuration = 7 days;
    uint256 constant arbitersRequiredCount = 3;

    // @notice Address of the foe - the counterparty to the beef.
    address public foe;
    // @notice Addresses of the arbiters - the judges of the beef.
    address[] public arbiters;
    // @notice Wager amount of each side.
    uint256 public wager;
    // @notice Title of the beef.
    string public title;
    // @notice Description of the beef.
    string public description;
    // @notice Timestamp when the settling can start.
    uint256 public settleStart;
    // @notice Deadline for foe to join the beef.
    uint256 public joinDeadline;
    // @notice Flag indicating if the beef is cooking - the foe had joined.
    bool public cooking;
    uint128 public resultYes;
    uint128 public resultNo;
    uint256 attendCount;
    mapping(address => bool) public hasSettled;
    mapping(address => bool) public hasAttended;

    error BeefArbiterAlreadyAttended(address sender);
    error BeefArbiterAlreadySettled(address sender);
    error BeefInvalidArbitersCount(uint256 providedCount, uint256 requiredCount);
    error BeefInvalidWager(uint256 declaredWager, uint256 providedWager);
    error BeefIsCooking();
    error BeefIsNotCooked(uint256 deadline, uint256 timestamp);
    error BeefIsRotten(uint256 deadline, uint256 timestamp);
    error BeefNotArbiter(address sender);
    error BeefNotFoe(address declaredFoe, address sender);
    error BeefNotRaw();
    error BeefNotRotten(uint256 deadline, uint256 timestamp);
    error BeefNotSettled(uint128 resultYes, uint128 resultNo, uint256 requiredSettleCount);

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

    modifier isNotCooking() {
        if (cooking) {
            revert BeefIsCooking();
        }
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(ConstructorParams memory params) public payable initializer {
        if (msg.value != params.wager) {
            revert BeefInvalidWager(params.wager, msg.value);
        }
        if (params.arbiters.length != arbitersRequiredCount) {
            revert BeefInvalidArbitersCount(params.arbiters.length, arbitersRequiredCount);
        }
        (wager, foe, settleStart, title, description, arbiters) =
            (params.wager, params.foe, params.settleStart, params.title, params.description, params.arbiters);
        joinDeadline = block.timestamp + joinDuration;

        __Ownable_init(params.owner);
    }

    // @notice Owner can set the arbiters, if beef is still raw.
    // function setArbiters(address[] memory _arbiters) public onlyOwner isNotCooking {
    //     arbiters = _arbiters;
    // }

    function arbiterAttend() public onlyArbiter {
        if (hasAttended[msg.sender]) {
            revert BeefArbiterAlreadyAttended(msg.sender);
        }
        hasAttended[msg.sender] = true;
        ++attendCount;
    }

    // @notice Foe can join the beef, paying the wager.
    function joinBeef() public payable onlyFoe isNotCooking {
        if (msg.value != wager) {
            revert BeefInvalidWager(wager, msg.value);
        }
        if (block.timestamp >= joinDuration) {
            revert BeefIsRotten(joinDuration, block.timestamp);
        }
        if (attendCount < arbitersRequiredCount) {
            revert BeefInvalidArbitersCount(attendCount, arbitersRequiredCount);
        }
        cooking = true;
    }

    // @notice Arbiter can settle the beef.
    // @param verdict True if outcome is according to the description, false otherwise.
    function settleBeef(bool verdict) public onlyArbiter {
        if (block.timestamp < settleStart) {
            revert BeefIsNotCooked(settleStart, block.timestamp);
        }
        if (block.timestamp >= settleStart + settlingDuration) {
            revert BeefIsRotten(settleStart + settlingDuration, block.timestamp);
        }
        if (hasSettled[msg.sender]) {
            revert BeefArbiterAlreadySettled(msg.sender);
        }

        if (verdict) {
            ++resultYes;
        } else {
            ++resultNo;
        }
        hasSettled[msg.sender] = true;
    }

    // @notice Serve the beef to the winner.
    function serveBeef() public {
        if (resultYes <= arbiters.length / 2 && resultNo <= arbiters.length / 2) {
            revert BeefNotSettled(resultYes, resultNo, arbiters.length / 2);
        }
        if (resultYes > resultNo) {
            payable(owner()).transfer(address(this).balance);
        } else {
            payable(foe).transfer(address(this).balance);
        }
    }

    // @notice Withdraw the wagers if beef had rotten (arbiters didn't settle in time).
    function withdrawRotten() public {
        if (cooking && block.timestamp < settleStart + settlingDuration) {
            revert BeefNotRotten(settleStart + settlingDuration, block.timestamp);
        }
        payable(owner()).transfer(address(this).balance / 2);
        payable(foe).transfer(address(this).balance / 2);
    }

    // @notice Withdraw the wager if beef had raw for too long.
    function withdrawRaw() public isNotCooking {
        if (block.timestamp < joinDuration) {
            revert BeefNotRotten(joinDuration, block.timestamp);
        }
        payable(owner()).transfer(address(this).balance);
    }
}
