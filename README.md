# Instruções
### Iniciar blockchain com Ganache
```ganache-cli --gasLimit 10000000000 --defaultBalanceEther 1000000000 --networkId 1337```

### Compilar smart contract com Truffle
```truffle compile```

### Deploy do smart contract na blockchain
```truffle migrate --config truffle-config.cjs``` ou ```truffle migrate --reset```

### Atualizar ABI
```jq '.abi' build/contracts/[nomeDoContrato].json > ABI/[nomeDoContrato]ABI.json```

### Iniciar servidor php
```php -S localhost:8000 router.php```

### Iniciar API requestManager
```node requestManager.js```

### Paginas criadas
Solicitação de circuitos: http://localhost:8000/circuitRequest.html

Upload de arquivo de uma política na blockchan: http://localhost:8000/policyUpload.html

Visualizador de requisições (usuário): http://localhost:8000/userRequestViewer.html 


