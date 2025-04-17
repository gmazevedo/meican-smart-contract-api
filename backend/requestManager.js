
import { fileURLToPath } from 'url';
import Web3 from 'web3';
import path from 'path';
import express from 'express';
import fs from 'fs';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { ethers } from 'ethers';

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

const web3 = new Web3(rpcUrl);
const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);
const artifact = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../ABI/MEICANRequestManagerABI.json')));
const abi = artifact.abi;
const contract = new ethers.Contract(contractAddress, abi, wallet);

// Solicitar circuito
app.post('/requestCircuit', async (req, res) => {
    const { source, destination, bandwidth, startTime, endTime, recurring, path, userPublicKey } = req.body;
    if (!source || !destination || !bandwidth || !startTime || !endTime || !path || !userPublicKey) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    try {
        const tx = await contract.requestCircuit(source, destination, bandwidth, startTime, endTime, recurring, path, userPublicKey);
        await tx.wait();
        res.json({ success: true, transactionHash: tx.hash });
    } catch (err) {
        console.error('Erro ao enviar transação:', err);
        res.status(500).json({ error: 'Erro ao registrar circuito.' });
    }
});

// Aprovar ou rejeitar
async function processCircuitAction(req, res, methodName) {
    const { requestId, fileContent, link } = req.body;
    if (!requestId || !fileContent || !link ) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    try {
        const fileBuffer = Buffer.from(fileContent, 'base64');
        const fileHash = ethers.keccak256(fileBuffer);
        console.log("Hash do arquivo:", fileHash);

        const tx = await contract[methodName](requestId, fileHash, link);
        await tx.wait();
        res.json({ success: true, transactionHash: tx.hash, fileHash });

    } catch (err) {
        console.error(`Erro ao ${methodName === 'approveCircuit' ? 'aprovar' : 'rejeitar'}:`, err);
        res.status(500).json({ error: 'Falha ao processar a requisição.' });
    }
}

app.post('/approveCircuit', (req, res) => {
    processCircuitAction(req, res, 'approveCircuit');
});

app.post('/rejectCircuit', (req, res) => {
    processCircuitAction(req, res, 'rejectCircuit');
});

// Rota: buscar circuitos de um usuário
app.get('/getUserCircuit', async (req, res) => {
    const userAddress = req.query.address;
    if (!userAddress) {
        return res.status(400).json({ error: 'Endereço não fornecido.' });
    }

    try {
        const filter = contract.filters.CircuitRequested();
        const logs = await contract.queryFilter(filter, 0, 'latest');

        const requests = await Promise.all(
            logs.map(async log => {
                const id = log.args.id;
                const request = await contract.getCircuitRequest(id);

                if (request.requester.toLowerCase() === userAddress.toLowerCase()) {
                    return {
                        id: request.id,
                        requester: request.requester,
                        source: request.params.source,
                        destination: request.params.destination,
                        bandwidth: Number(request.params.bandwidth),
                        startTime: Number(request.params.startTime),
                        endTime: Number(request.params.endTime),
                        recurring: request.params.recurring,
                        path: request.params.path,
                        status: Number(request.status),
                        policyHash: request.policyHash,
                        policyLink: request.policyLink
                    };
                }

                return null; // Ignora requisições de outro usuário
            })
        );

        const results = requests.filter(r => r !== null);
        res.json(results);
    } catch (err) {
        console.error('Erro ao buscar eventos do usuário:', err);
        res.status(500).json({ error: 'Erro ao buscar circuitos do usuário.' });
    }
});

// Rota: obter requisições pendentes
app.get('/getPendingCircuits', async (req, res) => {
    try {
        const filter = contract.filters.CircuitRequested();
        const logs = await contract.queryFilter(filter, 0, 'latest');

        const results = [];

        for (const log of logs) {
            const id = log.args.id;
            const request = await contract.getCircuitRequest(id);

            if (Number(request.status) === 0) { // STATUS_PENDING
                results.push({
                    id: request.id,
                    requester: request.requester,
                    source: request.params.source,
                    destination: request.params.destination,
                    bandwidth: Number(request.params.bandwidth),
                    startTime: Number(request.params.startTime),
                    endTime: Number(request.params.endTime),
                    recurring: request.params.recurring,
                    path: request.params.path,
                    status: Number(request.status)
                });
            }
        }

        res.json(results);
    } catch (err) {
        console.error('Erro ao buscar pendentes:', err);
        res.status(500).json({ error: 'Erro ao buscar requisições pendentes.' });
    }
});

// Rota: obter uma única requisição
app.get('/getRequestById', async (req, res) => {
    const requestId = req.query.id;
    if (!requestId) {
        return res.status(400).json({ error: 'Parâmetro "id" é obrigatório.' });
    }

    try {
        const request = await contract.getCircuitRequest(requestId);

        res.json({
            id: request.id,
            requester: request.requester,
            source: request.params.source,
            destination: request.params.destination,
            bandwidth: Number(request.params.bandwidth),
            startTime: Number(request.params.startTime),
            endTime: Number(request.params.endTime),
            recurring: request.params.recurring,
            path: request.params.path,
            status: Number(request.status),
            userPublicKey: request.params.userPublicKey
        });
    } catch (err) {
        console.error('Erro ao buscar requisição por ID:', err);
        res.status(500).json({ error: 'Erro ao buscar requisição.' });
    }
});

app.listen(port, () => {
    console.log(`requestManager.js rodando em http://localhost:${port}`);
});