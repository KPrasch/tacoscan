export const standardSubscriptionAbi = [
  {
    "type": "constructor",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "_coordinator",
        "type": "address",
        "internalType": "contract Coordinator"
      },
      {
        "name": "_accessController",
        "type": "address",
        "internalType": "contract GlobalAllowList"
      },
      {
        "name": "_feeToken",
        "type": "address",
        "internalType": "contract IERC20"
      },
      {
        "name": "_adopterSetter",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_initialBaseFeeRate",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_baseFeeRateIncrease",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_encryptorFeeRate",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_maxNodes",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_subscriptionPeriodDuration",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "_yellowPeriodDuration",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "_redPeriodDuration",
        "type": "uint32",
        "internalType": "uint32"
      }
    ]
  },
  {
    "type": "error",
    "name": "AddressEmptyCode",
    "inputs": [
      {
        "name": "target",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "AddressInsufficientBalance",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "FailedInnerCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidInitialization",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotInitializing",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OwnableInvalidOwner",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "OwnableUnauthorizedAccount",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "SafeERC20FailedOperation",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "event",
    "name": "EncryptorSlotsPaid",
    "inputs": [
      {
        "name": "sponsor",
        "type": "address",
        "internalType": "address",
        "indexed": true
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256",
        "indexed": false
      },
      {
        "name": "encryptorSlots",
        "type": "uint128",
        "internalType": "uint128",
        "indexed": false
      },
      {
        "name": "endOfCurrentPeriod",
        "type": "uint32",
        "internalType": "uint32",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Initialized",
    "inputs": [
      {
        "name": "version",
        "type": "uint64",
        "internalType": "uint64",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "internalType": "address",
        "indexed": true
      },
      {
        "name": "newOwner",
        "type": "address",
        "internalType": "address",
        "indexed": true
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SubscriptionPaid",
    "inputs": [
      {
        "name": "subscriber",
        "type": "address",
        "internalType": "address",
        "indexed": true
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256",
        "indexed": false
      },
      {
        "name": "encryptorSlots",
        "type": "uint128",
        "internalType": "uint128",
        "indexed": false
      },
      {
        "name": "endOfSubscription",
        "type": "uint32",
        "internalType": "uint32",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "WithdrawalToTreasury",
    "inputs": [
      {
        "name": "treasury",
        "type": "address",
        "internalType": "address",
        "indexed": true
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256",
        "indexed": false
      }
    ],
    "anonymous": false
  },
  {
    "type": "function",
    "name": "baseFees",
    "stateMutability": "view",
    "inputs": [
      {
        "name": "period",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "function",
    "name": "billingInfo",
    "stateMutability": "view",
    "inputs": [
      {
        "name": "periodNumber",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "paid",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "encryptorSlots",
        "type": "uint128",
        "internalType": "uint128"
      }
    ]
  },
  {
    "type": "function",
    "name": "coordinator",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract Coordinator"
      }
    ]
  },
  {
    "type": "function",
    "name": "encryptorFeeRate",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "function",
    "name": "encryptorFees",
    "stateMutability": "view",
    "inputs": [
      {
        "name": "encryptorSlots",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "duration",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "function",
    "name": "feeToken",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IERC20"
      }
    ]
  },
  {
    "type": "function",
    "name": "getCurrentPeriodNumber",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "function",
    "name": "getEndOfSubscription",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "endOfSubscription",
        "type": "uint32",
        "internalType": "uint32"
      }
    ]
  },
  {
    "type": "function",
    "name": "getPaidEncryptorSlots",
    "stateMutability": "view",
    "inputs": [
      {
        "name": "periodNumber",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "function",
    "name": "initialBaseFeeRate",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "function",
    "name": "initialize",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "_treasury",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "isPeriodPaid",
    "stateMutability": "view",
    "inputs": [
      {
        "name": "periodNumber",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ]
  },
  {
    "type": "function",
    "name": "maxNodes",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "function",
    "name": "owner",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "function",
    "name": "payForEncryptorSlots",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "additionalEncryptorSlots",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "payForSubscription",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "encryptorSlots",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "processRitualExtending",
    "stateMutability": "view",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "ritualId",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "processRitualPayment",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "initiator",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "ritualId",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "numberOfProviders",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "duration",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "redPeriodDuration",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ]
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "stateMutability": "nonpayable",
    "inputs": [],
    "outputs": []
  },
  {
    "type": "function",
    "name": "setAdopter",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "_adopter",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "startOfSubscription",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ]
  },
  {
    "type": "function",
    "name": "subscriptionPeriodDuration",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ]
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "usedEncryptorSlots",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "function",
    "name": "withdrawToTreasury",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "yellowPeriodDuration",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ]
  },
  {
    "type": "function",
    "name": "getStartOfSubscription",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ]
  },
  {
    "type": "function",
    "name": "getSubscriptionPeriodDuration",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ]
  },
  {
    "type": "function",
    "name": "getYellowPeriodDuration",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ]
  },
  {
    "type": "function",
    "name": "getRedPeriodDuration",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ]
  }
];

export const erc20Abi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export const accessControllerAbi = [
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "ritualId",
        "type": "uint32"
      },
      {
        "internalType": "address[]",
        "name": "encryptors",
        "type": "address[]"
      }
    ],
    "name": "authorize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "ritualId",
        "type": "uint32"
      },
      {
        "internalType": "address[]",
        "name": "encryptors",
        "type": "address[]"
      }
    ],
    "name": "deauthorize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]; 