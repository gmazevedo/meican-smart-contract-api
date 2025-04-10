# Instruções
### Iniciar blockchain com Ganache
```ganache-cli --gasLimit 10000000000 --defaultBalanceEther 1000000000 --networkId 1337```

### Compilar smart contract com Truffle
```truffle compile --config truffle-config.cjs```

### Deploy do smart contract na blockchain
```truffle migrate --config truffle-config.cjs``` ou ```truffle migrate --reset```

### Atualizar ABI
```jq '.abi' build/contracts/MEICANRequestManager.json > ABI/MEICANRequestManagerABI.json```

### Iniciar servidor php
```php -S localhost:8000 router.php```

### Iniciar API requestManager
```node requestManager.js```

### Paginas criadas
Solicitação de circuitos: http://localhost:8000/circuitRequest.html

Visualizador de requisições (usuário): http://localhost:8000/userRequestViewer.html 

Visualizador de requisições pendentes (operador): http://localhost:8000/pendingRequests.html

Avaliação de requisições (aprova/rejeita) + upload de politicas: http://localhost:8000/requestEval.html



