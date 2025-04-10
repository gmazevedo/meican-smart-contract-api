// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MEICANRequestManager {

    int8 public constant STATUS_PENDING = 0;
    int8 public constant STATUS_APPROVED = 1;
    int8 public constant STATUS_REJECTED = -1;  

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
        int8 status;
        uint timestamp;
        bool approved;
        bytes32 policyHash; 
        string policyLink;
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
        int8 status
    );
    
    event CircuitApproved(
        bytes32 id, 
        bytes32 policyHash,
        string policyLink
    );
    
    event CircuitRejected(
        bytes32 id, 
        bytes32 policyHash,
        string policyLink
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
            requestId, msg.sender, params, STATUS_PENDING, block.timestamp, false, 0,''
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
                STATUS_PENDING);

        return requestId;
    }
    
    function approveCircuit(
        bytes32 id,
        bytes32 policyHash,
        string memory policyLink
    ) public {
        require(requests[id].requester != address(0), "Requisicao inexistente.");
        require(requests[id].status == STATUS_PENDING, "Requisicao ja foi processada.");


        requests[id].status = STATUS_APPROVED;
        requests[id].policyHash = policyHash;
        requests[id].policyLink = policyLink;

        emit CircuitApproved(id, policyHash, policyLink);
    }
    
    function rejectCircuit(        
        bytes32 id,
        bytes32 policyHash,
        string memory policyLink
    ) public {
        require(requests[id].requester != address(0), "Requisicao inexistente.");
        require(requests[id].status == STATUS_PENDING, "Requisicao ja foi processada.");

        requests[id].status = STATUS_REJECTED;
        requests[id].policyLink = policyLink;
        requests[id].policyHash = policyHash;

        emit CircuitRejected(id, policyHash, policyLink);
    }
    
    function getCircuitRequest(bytes32 _id) public view returns (CircuitRequest memory) {
        return requests[_id];
    }

}
