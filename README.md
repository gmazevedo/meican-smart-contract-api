# Instructions
### Launch blockchain - Lots of ether for debug purpose
```ganache-cli --gasLimit 10000000000 --defaultBalanceEther 1000000000 --networkId 1337```

### Start persistent blockchain
```ganache --wallet.seed my-seed --db ./ganache-data --chain.chainId 1337```

### Start blockchain similar to Ethereum Mainnet
```ganache --chain.chainId 1 --chain.networkId 1 --miner.blockGasLimit 30000000 --miner.defaultGasPrice 430000000```

### Compile smart contract with Truffle
```truffle compile --config truffle-config.cjs```

### Deployment of the smart contract on the blockchain
```truffle migrate --config truffle-config.cjs``` ou ```truffle migrate --reset --config truffle-config.cjs```

### ABI update
```cp build/contracts/MEICANRequestManager.json ABI/MEICANRequestManagerABI.json```

### Start API requestManager
```node requestManager.js```

### Pages created
Circuit request: http://localhost:8000/circuitRequest.html

Request Viewer (user): http://localhost:8000/userRequestViewer.html 

Pending Request Viewer (operator): http://localhost:8000/pendingRequests.html

Request evaluation (approve/reject) + policy upload: http://localhost:8000/requestEval.html

### Utils

Send Policies to IPFS: http://localhost:8000/uploadPolicy.html

Decrypt policy file with private key: http://localhost:8000/decrypt.html

