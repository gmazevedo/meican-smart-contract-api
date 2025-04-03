import Web3 from 'web3';
import fs from 'fs';

// Carregar o ABI do contrato
const contractABI = JSON.parse(fs.readFileSync('./contractABI.json', 'utf-8'));

const web3 = new Web3('http://127.0.0.1:8545'); // RPC do Ganache
const contractAddress = '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab';
const contract = new web3.eth.Contract(contractABI, contractAddress);

async function testGetData() {

    const params = {
        source: "Origem",
        destination: "Destino",
        bandwidth: 100,
        policyIds: [
            web3.utils.padLeft("0xabc123", 64), 
            web3.utils.padLeft("0xdef456", 64)
        ],
        policyNames: ["Verificação de Usuário", "Regra de Segurança"],
        policyDescriptions: ["Apenas usuários autenticados", "Segurança de conexão reforçada"],
        startTime: 1717603200,
        endTime: 1717606800,
        recurring: false,
        path: "/caminho"
    };

    try {
        const functionData = contract.methods.requestCircuit(
            params.source,
            params.destination,
            params.bandwidth,
            params.policyIds,
            params.policyNames,
            params.policyDescriptions,
            params.startTime,
            params.endTime,
            params.recurring,
            params.path
        ).encodeABI();
        
        console.log("Function Data:", functionData);
    } catch (error) {
        console.error("Erro ao testar getData():", error);
    }
}

testGetData();
