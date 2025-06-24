import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
//import fs from 'fs';
import { createReadStream, unlinkSync, readFileSync, mkdirSync, existsSync } from 'fs';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { ethers } from 'ethers';
import multer from 'multer';
import PinataSDK from '@pinata/sdk';
import { deserialize } from 'v8';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir);
}

const upload = multer({ dest: uploadDir });

dotenv.config();
const app = express();
const port = 8000;

app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, '../web')));

const pinata = new PinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY);

const rpcUrl = process.env.RPC_URL;
const contractAddress = process.env.REQUEST_MANAGER_CONTRACT_ADDRESS;
const privateKey = process.env.PRIVATE_KEY;

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);
const artifact = JSON.parse(readFileSync(path.resolve(__dirname, '../ABI/MEICANRequestManagerABI.json')));
const abi = artifact.abi;
const contract = new ethers.Contract(contractAddress, abi, wallet);

// Solicitar circuito
app.post('/requestCircuit', async (req, res) => {
    const { source, destination, bandwidth, startTime, endTime, description, userPublicKey } = req.body;
    if (!source || !destination || !bandwidth || !startTime || !endTime || !userPublicKey) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    try {
        const tx = await contract.requestCircuit(source, destination, bandwidth, startTime, endTime, description, userPublicKey);
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
                        description: request.params.description,
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
                    description: request.params.description,
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
            description: request.params.description,
            status: Number(request.status),
            userPublicKey: request.params.userPublicKey
        });
    } catch (err) {
        console.error('Erro ao buscar requisição por ID:', err);
        res.status(500).json({ error: 'Erro ao buscar requisição.' });
    }
});

// Rota: salvar arquivo de política criptografado no Pinata IPFS
app.post('/uploadPolicy', upload.single('file'), async (req, res) => {
    try {
      const filePath = req.file.path;
      const readableStream = createReadStream(filePath);
  
      const result = await pinata.pinFileToIPFS(readableStream, {
        pinataMetadata: { name: req.file.originalname }
      });
  
      unlinkSync(filePath); // Deleta o arquivo local após o upload
  
      res.json({ ipfsLink: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}` });
    } catch (error) {
      console.error('❌ Erro ao enviar arquivo para o Pinata:', error);
      res.status(500).send('Erro ao enviar para o Pinata.');
    }
  });


app.listen(port, () => {
    console.log(`requestManager.js rodando em http://localhost:${port}`);
});