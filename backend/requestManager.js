// requestManager.js (usando Express e web3.js)
import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import Web3 from 'web3';
import fs from 'fs';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = 8000;

app.use(bodyParser.json());

app.use(express.static(path.resolve(__dirname, '../web')));

const rpcUrl = process.env.RPC_URL;
const contractAddress = process.env.REQUEST_MANAGER_CONTRACT_ADDRESS;
const privateKey = process.env.PRIVATE_KEY;
const adminAddress = process.env.ADMIN_ADDRESS;

const web3 = new Web3(rpcUrl);
const contractABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../ABI/RequestManagerABI.json')));
const contract = new web3.eth.Contract(contractABI, contractAddress);

const fileRegistryABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../ABI/FileRegistryABI.json')));
const fileRegistryAddress = process.env.FILE_REGISTRY_CONTRACT_ADDRESS;
const fileRegistryContract = new web3.eth.Contract(fileRegistryABI, fileRegistryAddress);

// Rota: buscar circuitos de um usuário
app.get('/getCircuit', async (req, res) => {
    const userAddress = req.query.address;
    if (!userAddress) {
        return res.status(400).json({ error: 'Endereço não fornecido.' });
    }

    try {
        const eventSignature = web3.utils.sha3('CircuitRequested(bytes32,address,string,string,uint256,uint256,uint256,bool,string,string)');
        const logs = await web3.eth.getPastLogs({
            fromBlock: '0x0',
            toBlock: 'latest',
            address: contractAddress,
            topics: [eventSignature]
        });

        const results = [];

        for (let log of logs) {
            const decoded = web3.eth.abi.decodeLog([
                { type: 'bytes32', name: 'id' },
                { type: 'address', name: 'requester' },
                { type: 'string', name: 'source' },
                { type: 'string', name: 'destination' },
                { type: 'uint256', name: 'bandwidth' },
                { type: 'uint256', name: 'startTime' },
                { type: 'uint256', name: 'endTime' },
                { type: 'bool', name: 'recurring' },
                { type: 'string', name: 'path' },
                { type: 'string', name: 'status' }
            ], log.data, log.topics.slice(1));

            if (decoded.requester.toLowerCase() === userAddress.toLowerCase()) {
                results.push({
                    id: decoded.id,
                    requester: decoded.requester,
                    source: decoded.source,
                    destination: decoded.destination,
                    bandwidth: parseInt(decoded.bandwidth),
                    startTime: parseInt(decoded.startTime),
                    endTime: parseInt(decoded.endTime),
                    recurring: decoded.recurring,
                    path: decoded.path,
                    status: decoded.status
                });
            }
        }

        res.json(results);
    } catch (err) {
        console.error('Erro ao buscar eventos:', err);
        res.status(500).json({ error: 'Erro ao buscar eventos.' });
    }
});

// Rota: solicitar circuito
app.post('/requestCircuit', async (req, res) => {
    const { source, destination, bandwidth, startTime, endTime, recurring, path } = req.body;

    if (!source || !destination || !bandwidth || !startTime || !endTime || !path) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    try {
        const data = contract.methods.requestCircuit(source, destination, bandwidth, startTime, endTime, recurring, path).encodeABI();
        const tx = {
            from: adminAddress,
            to: contractAddress,
            data,
            gas: 350000,
            gasPrice: web3.utils.toWei('3', 'gwei'),
        };

        const signed = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
        res.json({ success: true, transactionHash: receipt.transactionHash });
    } catch (err) {
        console.error('Erro ao enviar transação:', err);
        res.status(500).json({ error: 'Erro ao registrar circuito.' });
    }
});

// Rota: aprovar circuito
app.post('/approveCircuit', async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID não fornecido.' });

    try {
        const data = contract.methods.approveCircuit(id).encodeABI();
        const tx = {
            from: adminAddress,
            to: contractAddress,
            data,
            gas: 200000,
            gasPrice: web3.utils.toWei('3', 'gwei'),
        };

        const signed = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
        res.json({ success: true, transactionHash: receipt.transactionHash });
    } catch (err) {
        console.error('Erro ao aprovar circuito:', err);
        res.status(500).json({ error: 'Erro ao aprovar circuito.' });
    }
});

// Rota: rejeitar circuito
app.post('/rejectCircuit', async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID não fornecido.' });

    try {
        const data = contract.methods.rejectCircuit(id).encodeABI();
        const tx = {
            from: adminAddress,
            to: contractAddress,
            data,
            gas: 200000,
            gasPrice: web3.utils.toWei('3', 'gwei'),
        };

        const signed = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
        res.json({ success: true, transactionHash: receipt.transactionHash });
    } catch (err) {
        console.error('Erro ao rejeitar circuito:', err);
        res.status(500).json({ error: 'Erro ao rejeitar circuito.' });
    }
});

app.post('/registerFile', async (req, res) => {
    const { fileHash, link } = req.body;
    if (!fileHash || !link) {
        return res.status(400).json({ error: 'Hash do arquivo e link são obrigatórios.' });
    }

    try {
        const data = fileRegistryContract.methods.registerFileHash(fileHash, link).encodeABI();
        const tx = {
            from: adminAddress,
            to: fileRegistryContract.options.address,
            data,
            gas: 150000,
            gasPrice: web3.utils.toWei('3', 'gwei')
        };

        const signed = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
        res.json({ success: true, transactionHash: receipt.transactionHash });
    } catch (err) {
        console.error('Erro ao registrar arquivo:', err);
        res.status(500).json({ error: 'Erro ao registrar o hash e o link na blockchain.' });
    }
});


app.listen(port, () => {
    console.log(`requestManager.js rodando em http://localhost:${port}`);
});
