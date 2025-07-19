# MEICAN Request Manager   
Official repository of the undergraduate thesis of **Gessica F. Mendonça Azevedo.**

API for decentralized **circuit request management** that extends the MEICAN (Management Environment of Inter-domain Circuits for Advanced Networks) project with:
* **Smart Contract `MEICANRequestManager.sol`** (Solidity 0.8.20) – records IPFS requests, decisions, and links.
* **Node/Express Backend (backend/requestManager.js)** – integrates with the contract (ethers.js 6.13), uploads files to IPFS via Pinata, and exposes REST/WebSockets routes.
* **HTML + JS Frontend** – lists requests, performs hybrid encryption (AES-CBC 256 + RSA 2048) in the browser, and triggers the backend/contract.
* **Test scripts** to measure gas and execution time.

---

## Overview
| Objective | Description |
|----------|-----------|
| **Auditability** | Record approvals/rejections of circuits (and respective policy files) in an **immutable** way. |
| **Transparency** | Allow any interested party to validate the integrity of the process by querying events on the blockchain. |
| **Data protection** | Policy files never travel in plain text: they are encrypted locally, uploaded to Pinata, and only their hashes and links are made public. |

---

## Repository structure


    meican-smart-contract-api-main/
      ├── ABI/ # Post-compile generated ABIs
      ├── backend/ # API Express + Pinata/Ethereum integration
      │ └── .env # Environment variables file
      ├── contracts/ # Smart contracts Solidity
      ├── migrations/ # Scripts Truffle
      ├── php/ # LEGACY (not required, kept for reference)
      ├── scripts/ # Deployment, utilities and performance testing
      ├── test/ # Test scripts
      ├── web/ # Static front-end
      └── README.md # This file

---

## Requirements 

| Tool | Minimum version | Observation |
|------------|---------------|------------|
| **Node.js** | 20 LTS | |
| **npm** | 10 | |
| **Truffle** | 5.11 | `npm i -g truffle` |
| **Ganache CLI** | 7.x | local blockchain |
| **Solidity** | 0.8.20 | compiler via Truffle |
| **Git** | — | |
| **Pinata** | Free account | generate API Keys |

---

## Main dependencies
- ethers.js 6.13.7 – Ethereum interaction
- @pinata/sdk 2.1 – upload & pinning IPFS
- jszip 3.10 – ZIP packaging
- node-forge / Web Crypto API – RSA/AES in the browser
- Truffle 5 / Ganache – local development
    
## Settings

1. **Clone the repository**
   ```bash
   git clone https://github.com/gmazevedo/meican-smart-contract-api.git
   cd meican-smart-contract-api
   
2. **Install the dependencies**
   ```bash
    npm install

3.  **Create the environment variables file**
   
    Path: ```backend/.env```

     ```bash
      RPC_URL=http://127.0.0.1:8545  # Ganache endpoint
      REQUEST_MANAGER_CONTRACT_ADDRESS= # Contract address
      ADMIN_ADDRESS=         # Deploy account
      PRIVATE_KEY=          # Deploy account private key
      PORT=8000
      PINATA_API_KEY=       # Pinata API key
      PINATA_SECRET_API_KEY=  # Pinata API key secret
      ```

4. Initialize local blockchain (Ethereum Mainnet Similar)
     ```bash
      ganache --chain.chainId 1 --chain.networkId 1 --miner.blockGasLimit 30000000 --miner.defaultGasPrice 430000000
     ```

5.  **Compile and migrate contracts**
     ```bash
      truffle compile --config truffle-config.cjs
      truffle migrate --reset --network development --config truffle-config.cjs
     ```
     
6. **ABI update**
     ```bash
      cp build/contracts/MEICANRequestManager.json ABI/MEICANRequestManagerABI.json
     ```
     
7.  **Start the backend**
     ```bash
      cd backend
      node requestManager.js
      ```
---

## Endpoints & main pages

| Page                                         | Route                      | Function                                           |
| ---------------------------------------------- | ------------------------- | ------------------------------------------------ | 
| `http://localhost:8000/circuitRequest.html`    | `/circuitRequest.html`    | User opens a new request                |
| `http://localhost:8000/userRequestViewer.html` | `/userRequestViewer.html` | User tracks their requests               |
| `http://localhost:8000/pendingRequests.html`   | `/pendingRequests.html`   | Operator lists pending requests             |
| `http://localhost:8000/requestEval.html`       | `/requestEval.html`       | Operator approves/rejects + uploads policy |

### Util pages
| Page                                    |  Route                     | Function                                           |
| ----------------------------------------- | ------------------------- | ------------------------------------------------ |
| `http://localhost:8000/uploadPolicy.html` | `/uploadPolicy.html`      | Standalone IPFS upload tool                 |
| `http://localhost:8000/decrypt.html`      | `/decrypt.html`           | Local decryption via private key          |


## License
© 2025 Gessica Franciéle Mendonça Azevedo
