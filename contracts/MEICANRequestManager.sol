// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MEICANRequestManager {
    struct CircuitParams {
        string source;
        string destination;
        uint bandwidth;
        uint startTime;
        uint endTime;
        bool recurring;
        string path;
    }
    
    struct CircuitRequest {
        bytes32 id;
        address requester;
        CircuitParams params;
        string status;
        uint timestamp;
        bool approved;
        bytes32 policyHash; 
        string policyLink;
        string encryptedAESKey;
    }
    
    mapping(bytes32 => CircuitRequest) public requests;
    
    event CircuitRequested(
        bytes32 id,
        address requester,
        string source,
        string destination,
        uint bandwidth,
        uint startTime,
        uint endTime,
        bool recurring,
        string path,
        string status
    );
    
    event CircuitApproved(
        bytes32 id, 
        bytes32 policyHash,
        string policyLink,
        string encryptedAESKey
    );
    
    event CircuitRejected(
        bytes32 id, 
        bytes32 policyHash,
        string policyLink,
        string encryptedAESKey
    );
    
    function requestCircuit(
        string memory source,
        string memory destination,
        uint bandwidth,
        uint startTime,
        uint endTime,
        bool recurring,
        string memory path
    ) public returns (bytes32) {
        bytes32 requestId = keccak256(abi.encodePacked(msg.sender, source, destination, block.timestamp));
        
        CircuitParams memory params = CircuitParams(
            source, destination, bandwidth, startTime, endTime, recurring, path
        );

        requests[requestId] = CircuitRequest(
            requestId, msg.sender, params, "pending", block.timestamp, false, 0,'',''
        );
        
        emit CircuitRequested(
                requestId,
                msg.sender,
                source,
                destination,
                bandwidth,
                startTime,
                endTime,
                recurring,
                path,
                "pending");

        return requestId;
    }
    
    function approveCircuit(
        bytes32 id,
        bytes32 policyHash,
        string memory policyLink,
        string memory encryptedAESKey
    ) public {
        require(requests[id].requester != address(0), "Requisicao inexistente.");
        require(
            keccak256(bytes(requests[id].status)) == keccak256(bytes("pending")),
            "Requisicao ja foi processada."
        );

        requests[id].status = "approved";
        requests[id].policyHash = policyHash;
        requests[id].policyLink = policyLink;

        emit CircuitApproved(id, policyHash, policyLink, encryptedAESKey);
    }
    
    function rejectCircuit(        
        bytes32 id,
        bytes32 policyHash,
        string memory policyLink,
        string memory encryptedAESKey
    ) public {
        require(requests[id].requester != address(0), "Requisicao inexistente.");
        require(
            keccak256(bytes(requests[id].status)) == keccak256(bytes("pending")),
            "Requisicao ja foi processada."
        );
        requests[id].status = "rejected";
        requests[id].policyLink = policyLink;
        requests[id].policyHash = policyHash;

        emit CircuitRejected(id, policyHash, policyLink, encryptedAESKey);
    }
    
    function getCircuitRequest(bytes32 _id) public view returns (CircuitRequest memory) {
        return requests[_id];
    }

}
