// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Beef} from "./Beef.sol";

// @notice Factory contract for creating Beef contracts. User entrypoint in Settlebeef.
contract Slaughterhouse is Ownable2Step {

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
    address public WETH9;
    // @notice The address of Wrapped Staked ETH
    address public WSTETH;
    // @notice The address of Uniswap V3 Router (for swapping WETH9/WSTETH)
    address public uniswapV3Router;

    error InvalidBasisPoints(uint256 totalBasisPoints, uint256 providedBasisPoints);
    error ZeroBalance();
    error EthTransferFailed();
    error IndexOutOfBounds();

    event BeefPackaged(address indexed beef, address indexed owner, address indexed challenger);
    event RewardBasisPointsChanged(uint256 newProtocolRewardBasisPoints, uint256 newArbitersRewardBasisPoints);
    event RewardsWithdrawn(uint256 amount);

    constructor(
        address _weth,
        address _wsteth,
        address _uniswapV3Router,
        address initialOwner,
        uint256 _protocolRewardBasisPoints,
        uint256 _arbitersRewardBasisPoints
    ) Ownable(initialOwner) {
        beefImplementation = address(new Beef());
        WETH9 = _weth;
        WSTETH = _wsteth;
        uniswapV3Router = _uniswapV3Router;
        protocolRewardBasisPoints = _protocolRewardBasisPoints;
        arbitersRewardBasisPoints = _arbitersRewardBasisPoints;
    }

    function getBeefsSlice(uint256 from, uint256 to) external view returns(address[] memory) {
        if (from > to || to > beefs.length) {
            revert IndexOutOfBounds();
        }

        uint256 sliceSize = to - from;
        address[] memory beefSlice = new address[](sliceSize);

        uint256 beefIndex = from;
        for (uint256 i; i < sliceSize; ) {
            beefSlice[i] = beefs[beefIndex];

            unchecked {
                ++i;
                ++beefIndex;
            }
        }

        return beefSlice;
    }

    function getBeefsLength() external view returns (uint256) {
        return beefs.length;
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
        Beef(beef).initialize{value: msg.value}(params, amountOutMin, WETH9, WSTETH, uniswapV3Router, payable(this), protocolRewardBasisPoints, arbitersRewardBasisPoints);
        beefs.push(beef);
        emit BeefPackaged(beef, params.owner, params.challenger);
        return beef;
    }

    function withdrawRewards() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) {
            revert ZeroBalance();
        }

        _transferEth(owner(), balance);

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

    function _transferEth(address recipient, uint256 amount) internal {
        (bool isSent,) = recipient.call{value: amount}("");

        if (!isSent) {
            revert EthTransferFailed();
        }
    }

    receive() external payable {}
}
