export const slaughterhouseAbi = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
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
            name: "foe",
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
        ],
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "payable",
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
        name: "foe",
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
] as const;
