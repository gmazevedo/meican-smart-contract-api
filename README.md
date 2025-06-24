# Instruções
### Iniciar blockchain com Ganache
```ganache-cli --gasLimit 10000000000 --defaultBalanceEther 1000000000 --networkId 1337```

### Iniciar blockchain persistente
```ganache --wallet.seed my-seed --db ./ganache-data --chain.chainId 1337```

### Iniciar blockchain similiar a Ethereum Mainnet
```ganache --chain.chainId 1 --chain.networkId 1 --miner.blockGasLimit 30000000 --gasPrice 2000000000```

### Compilar smart contract com Truffle
```truffle compile --config truffle-config.cjs```

### Deploy do smart contract na blockchain
```truffle migrate --config truffle-config.cjs``` ou ```truffle migrate --reset --config truffle-config.cjs```

### Atualizar ABI
```cp build/contracts/MEICANRequestManager.json ABI/MEICANRequestManagerABI.json```

### Iniciar API requestManager
```node requestManager.js```

### Paginas criadas
Solicitação de circuitos: http://localhost:8000/circuitRequest.html

Visualizador de requisições (usuário): http://localhost:8000/userRequestViewer.html 

Visualizador de requisições pendentes (operador): http://localhost:8000/pendingRequests.html

Avaliação de requisições (aprova/rejeita) + upload de politicas: http://localhost:8000/requestEval.html

Envio de políticas para IPFS: http://localhost:8000/uploadPolicy.html

Decriptografar arquivo de políticas com chave privada: http://localhost:8000/decrypt.html

