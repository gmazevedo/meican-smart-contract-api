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

// Rota: buscar circuitos de um usuário
app.get('/getUserCircuit', async (req, res) => {
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

// Rota: obter requisições pendentes
app.get('/getPendingCircuits', async (req, res) => {
    try {
        const eventSignature = web3.utils.sha3('CircuitRequested(bytes32,address,string,string,uint256,uint256,uint256,bool,string,string)');
        const logs = await web3.eth.getPastLogs({
            fromBlock: '0x0',
            toBlock: 'latest',
            address: contract.options.address,
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

            if (decoded.status === 'pending') {
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
        console.error('Erro ao buscar pendentes:', err);
        res.status(500).json({ error: 'Erro ao buscar requisições pendentes.' });
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

// Rota: rejeitar circuito
app.post('/rejectCircuit', (req, res) => {
    processCircuitAction(req, res, 'rejectCircuit');
});

// Rota: aprovar circuito
app.post('/approveCircuit', (req, res) => {
    processCircuitAction(req, res, 'approveCircuit');
});

// função auxiliar para gerar chave AES e criptografar conteúdo
function encryptWithAES(contentBuffer) {
    const key = crypto.randomBytes(32); // AES 256 bits
    const iv = crypto.randomBytes(16);  // IV 128 bits
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(contentBuffer), cipher.final()]);
    return { encrypted, key, iv };
}

// função para criptografar chave AES com RSA pública
function encryptAESKeyWithRSA(aesKey, userPublicKey) {
    return crypto.publicEncrypt({
        key: userPublicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    }, aesKey);
}

// Função comum de processamento (aproveitada para ambos endpoints)
async function processCircuitAction(req, res, methodName) {
    const { requestId, fileContent, link, userPublicKey } = req.body;
    if (!requestId || !fileContent || !link || !userPublicKey) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    try {
        const fileBuffer = Buffer.from(atob(fileContent), 'binary');
        const { encrypted, key: aesKey, iv } = encryptWithAES(fileBuffer);
        const encryptedAESKey = encryptAESKeyWithRSA(Buffer.concat([aesKey, iv]), userPublicKey);
        const fileHash = web3.utils.sha3(encrypted.toString('hex'));
        const payload = '0x' + encryptedAESKey.toString('hex');

        const data = contract.methods[methodName](requestId, fileHash, link, payload).encodeABI();
        const tx = {
            from: adminAddress,
            to: contract.options.address,
            data,
            gas: 300000,
            gasPrice: web3.utils.toWei('3', 'gwei')
        };

        const signed = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
        res.json({ success: true, transactionHash: receipt.transactionHash });
    } catch (err) {
        console.error(`Erro ao ${methodName === 'approveCircuit' ? 'aprovar' : 'rejeitar'}:`, err);
        res.status(500).json({ error: 'Falha ao processar a requisição.' });
    }
}
app.listen(port, () => {
    console.log(`requestManager.js rodando em http://localhost:${port}`);
});
