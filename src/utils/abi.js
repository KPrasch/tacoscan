export const CoordinatorABI = [
    {
        "type": "function",
        "name": "rituals",
        "inputs": [
            {
                "name": "ritualId",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "initiator",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "initTimestamp",
                "type": "uint32",
                "internalType": "uint32"
            },
            {
                "name": "endTimestamp",
                "type": "uint32",
                "internalType": "uint32"
            },
            {
                "name": "totalTranscripts",
                "type": "uint16",
                "internalType": "uint16"
            },
            {
                "name": "totalAggregations",
                "type": "uint16",
                "internalType": "uint16"
            },
            {
                "name": "authority",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "dkgSize",
                "type": "uint16",
                "internalType": "uint16"
            },
            {
                "name": "threshold",
                "type": "uint16",
                "internalType": "uint16"
            },
            {
                "name": "aggregationMismatch",
                "type": "bool",
                "internalType": "bool"
            },
            {
                "name": "accessController",
                "type": "address",
                "internalType": "IEncryptionAuthorizer"
            },
            {
                "name": "publicKey",
                "type": "tuple",
                "internalType": "struct BLS12381.G1Point",
                "components": [
                    {
                        "name": "x",
                        "type": "uint256",
                        "internalType": "uint256"
                    },
                    {
                        "name": "y",
                        "type": "uint256",
                        "internalType": "uint256"
                    }
                ]
            },
            {
                "name": "aggregatedTranscript",
                "type": "bytes",
                "internalType": "bytes"
            },
            {
                "name": "feeModel",
                "type": "address",
                "internalType": "IFeeModel"
            }
        ],
        "stateMutability": "view"
    }
]; 