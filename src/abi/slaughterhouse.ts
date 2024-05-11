export const slaughterhouseAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_weth",
        type: "address",
        internalType: "address",
      },
      {
        name: "_wsteth",
        type: "address",
        internalType: "address",
      },
      {
        name: "_uniswapV2Router",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "WETH",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "WSTETH",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "beefImplementation",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "beefs",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "canUpdateStreetCredit",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getBeefs",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "packageBeef",
    inputs: [
      {
        name: "params",
        type: "tuple",
        internalType: "struct Beef.ConstructorParams",
        components: [
          {
            name: "owner",
            type: "address",
            internalType: "address",
          },
          {
            name: "wager",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "challenger",
            type: "address",
            internalType: "address",
          },
          {
            name: "settleStart",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "title",
            type: "string",
            internalType: "string",
          },
          {
            name: "description",
            type: "string",
            internalType: "string",
          },
          {
            name: "arbiters",
            type: "address[]",
            internalType: "address[]",
          },
          {
            name: "joinDeadline",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "staking",
            type: "bool",
            internalType: "bool",
          },
        ],
      },
      {
        name: "amountOutMin",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address payable",
      },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "streetCredit",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "int256",
        internalType: "int256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "uniswapV2Router",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "updateStreetCredit",
    inputs: [
      {
        name: "votes",
        type: "uint8[]",
        internalType: "enum StreetCredit.Vote[]",
      },
      {
        name: "to",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "BeefPackaged",
    inputs: [
      {
        name: "beef",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "challenger",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "ERC1167FailedCreateClone",
    inputs: [],
  },
  {
    type: "error",
    name: "StreetCreditTransferForbidden",
    inputs: [],
  },
] as const;
