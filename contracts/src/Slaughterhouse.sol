// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {Beef} from "./Beef.sol";
import {StreetCredit} from "./StreetCredit.sol";

// @notice Factory contract for creating Beef contracts. User entrypoint in Settlebeef.
contract Slaughterhouse is StreetCredit, Ownable {

    // @notice The total basis points representing 100% (10,000 basis points = 100%)
    uint256 public constant totalBasisPoints = 10000;

    // @notice The implementation address for Beef contract
    address public beefImplementation;
    // @notice The list of all beefs
    address[] public beefs;

    // @notice The portion of rewards allocated to the protocol (1 point = 0.01%)
    uint256 public protocolRewardBasisPoints;

    // @notice The portion of total rewards allocated to the arbiters (1 point = 0.01%)
    uint256 public arbitersRewardBasisPoints;

    // @notice The address of Wrapped ETH
    address public WETH;
    // @notice The address of Wrapped Staked ETH
    address public WSTETH;
    // @notice The address of Uniswap V2 Router (for swapping WETH/WSTETH)
    address public uniswapV2Router;

    error InvalidBasisPoints(uint256 totalBasisPoints, uint256 providedBasisPoints);
    error ZeroBalance();

    event BeefPackaged(address indexed beef, address indexed owner, address indexed challenger);
    event RewardBasisPointsChanged(uint256 newProtocolRewardBasisPoints, uint256 newArbitersRewardBasisPoints);
    event RewardsWithdrawn(uint256 amount);

    constructor(
        address _weth,
        address _wsteth,
        address _uniswapV2Router,
        address initialOwner,
        uint256 _protocolRewardBasisPoints,
        uint256 _arbitersRewardBasisPoints
    ) Ownable(initialOwner) {
        beefImplementation = address(new Beef());
        WETH = _weth;
        WSTETH = _wsteth;
        uniswapV2Router = _uniswapV2Router;
        protocolRewardBasisPoints = _protocolRewardBasisPoints;
        arbitersRewardBasisPoints = _arbitersRewardBasisPoints;
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
        Beef(beef).initialize{value: msg.value}(params, amountOutMin, WETH, WSTETH, uniswapV2Router, address(this), protocolRewardBasisPoints, arbitersRewardBasisPoints);
        beefs.push(beef);
        canUpdateStreetCredit[beef] = true;
        emit BeefPackaged(beef, params.owner, params.challenger);
        return beef;
    }

    function withdrawRewards() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) {
            revert ZeroBalance();
        }

        payable(owner()).transfer(balance);

        emit RewardsWithdrawn(balance);
    }

    function setRewardBasisPoints(uint256 _protocolRewardBasisPoints, uint256 _arbitersRewardBasisPoints) external onlyOwner {
        if (_protocolRewardBasisPoints + _arbitersRewardBasisPoints > totalBasisPoints) {
            revert InvalidBasisPoints(totalBasisPoints, _protocolRewardBasisPoints + _arbitersRewardBasisPoints);
        }

        protocolRewardBasisPoints = _protocolRewardBasisPoints;
        arbitersRewardBasisPoints = _arbitersRewardBasisPoints;

        emit RewardBasisPointsChanged(protocolRewardBasisPoints, arbitersRewardBasisPoints);
    }
}
