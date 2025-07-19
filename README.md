# MEICAN Request Manager   
Repositório oficial do Trabalho de Conclusão de Curso de **Gessica F. Mendonça Azevedo**.  
Gerenciador descentralizado de **requisições de circuitos** que estende o projeto MEICAN (Management Environment of Inter-domain Circuits for Advanced Networks) com:
* **Smart Contract `MEICANRequestManager.sol`** (Solidity 0.8.20) – grava solicitações, decisões e links IPFS.
* **Backend Node/Express (`backend/requestManager.js`)** – integra-se ao contrato (ethers.js 6.13), faz upload de arquivos no **IPFS via Pinata** e expõe rotas REST/WebSockets.
* **Front-end HTML + JS** – lista requisições, realiza **criptografia híbrida (AES-CBC 256 + RSA 2048)** no navegador e aciona o backend/contrato.
* **Scripts de teste** para medir gás e tempo de execução.

---

## Visão geral
| Objetivo | Descrição |
|----------|-----------|
| **Auditabilidade** | Registrar aprovações/rejeições de circuitos (e respectivos arquivos de política) de forma **imutável**. |
| **Transparência** | Permitir que qualquer parte interessada valide a integridade do processo consultando eventos na blockchain. |
| **Proteção de dados** | Arquivos de política nunca transitam em texto puro: são cifrados localmente, enviados ao Pinata e apenas seus hashes e links ficam públicos. |

---

## Estrutura do repositório


    meican-smart-contract-api-main/
      ├── ABI/ # ABIs geradas pós-compile
      ├── backend/ # API Express + integração Pinata/Ethereum
      │ └── .env # arquivo de variáveis de ambiente
      ├── contracts/ # Smart contracts Solidity
      ├── migrations/ # Scripts Truffle
      ├── php/ # LEGACY (não requerido, mantido para referência)
      ├── scripts/ # Deploy, utilidades e testes de desempenho
      ├── test/ # Scripts de teste
      ├── web/ # Front-end estático
      └── README.md # este arquivo

---

## Requisitos 

| Ferramenta | Versão mínima | Observação |
|------------|---------------|------------|
| **Node.js** | 20 LTS | |
| **npm** | 10 | |
| **Truffle** | 5.11 | `npm i -g truffle` |
| **Ganache CLI** | 7.x | blockchain local |
| **Solidity** | 0.8.20 | compilador via Truffle |
| **Git** | — | |
| **Pinata** | conta grátis OK | gerar API Keys |

---

## Principais dependências
- ethers.js 6.13.7 – interação Ethereum
- @pinata/sdk 2.1 – upload & pinning IPFS
- jszip 3.10 – empacotamento ZIP
- node-forge / Web Crypto API – RSA/AES no browser
- Truffle 5 / Ganache – desenvolvimento local
    
## Configuração

1. **Clone o repositório**
   ```bash
   git clone https://github.com/<seu-usuario>/meican-requestmanager.git
   cd meican-requestmanager
   
2. **Instale as dependências**
   ```bash
    npm install

3.  **Crie o arquivo de variáveis de ambiente**
   
    Caminho: ```backend/.env```

     ```bash
      PRIVATE_KEY=          # Chave da conta que fará o deploy
      RPC_URL=http://127.0.0.1:8545  # Ganache/Hardhat ou endpoint Infura/Alchemy
      PINATA_API_KEY=
      PINATA_SECRET_API_KEY=
      ```

4. Inicializar blockchain local (Ethereum Mainnet Similar)
     ```bash
      ganache --chain.chainId 1 --chain.networkId 1 --miner.blockGasLimit 30000000 --miner.defaultGasPrice 430000000
     ```

5.  **Compile e migre os contratos**
     ```bash
      truffle compile --config truffle-config.cjs
      truffle migrate --reset --network development --config truffle-config.cjs
     ```
     
6. **ABI update**
     ```bash
      cp build/contracts/MEICANRequestManager.json ABI/MEICANRequestManagerABI.json
     ```
     
7.  **Inicie o backend**
     ```bash
      cd backend
      node requestManager.js
      ```
---

## Endpoints & páginas principais

| Página                                         | Rota                      | Função                                           |
| ---------------------------------------------- | ------------------------- | ------------------------------------------------ | 
| `http://localhost:8000/circuitRequest.html`    | `/circuitRequest.html`    | Usuário abre uma nova solicitação                |
| `http://localhost:8000/userRequestViewer.html` | `/userRequestViewer.html` | Usuário acompanha suas requisições               |
| `http://localhost:8000/pendingRequests.html`   | `/pendingRequests.html`   | Operador lista requisições pendentes             |
| `http://localhost:8000/requestEval.html`       | `/requestEval.html`       | Operador aprova/rejeita + faz upload da política |

### Util Pages
| Página                                    |  Rota                     | Função                                           |
| ----------------------------------------- | ------------------------- | ------------------------------------------------ |
| `http://localhost:8000/uploadPolicy.html` | `/uploadPolicy.html`      | Ferramenta avulsa de upload IPFS                 |
| `http://localhost:8000/decrypt.html`      | `/decrypt.html`           | Descriptografia local via chave privada          |


## License
© 2025 Gessica Franciéle Mendonça Azevedo
