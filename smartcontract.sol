// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MEICANPolicies {
    
    struct CircuitRequest {
        bytes32 id;
        address requester;
        string source;
        string destination;
        uint bandwidth;
        bytes32[] policyIds;
        string[] policyNames;
        string[] policyDescriptions;
        uint startTime;
        uint endTime;
        bool recurring;
        string path;
        string status;
        uint timestamp;
        bool approved;
    }
    
    mapping(bytes32 => CircuitRequest) public requests;
    
    event CircuitRequested(
        bytes32 id, 
        address requester, 
        string source, 
        string destination, 
        uint bandwidth, 
        bytes32[] policyIds, 
        string[] policyNames, 
        string[] policyDescriptions,
        uint startTime,
        uint endTime,
        bool recurring,
        string path,
        string status
    );
    
    event CircuitApproved(
        bytes32 id, 
        address requester, 
        string source, 
        string destination, 
        uint bandwidth, 
        bytes32[] policyIds, 
        uint startTime,
        uint endTime,
        bool recurring,
        string path,
        string status,
        uint timestamp
    );
    
    event CircuitRejected(bytes32 id);
    
    function requestCircuit(
        string memory _source, 
        string memory _destination, 
        uint _bandwidth, 
        bytes32[] memory _policyIds,
        string[] memory _policyNames,
        string[] memory _policyDescriptions,
        uint _startTime,
        uint _endTime,
        bool _recurring,
        string memory _path
    ) public {
        require(
            _policyIds.length == _policyNames.length && 
            _policyNames.length == _policyDescriptions.length,
            "Tamanho das listas de políticas não coincidem"
        );
        
        bytes32 requestId = keccak256(abi.encodePacked(msg.sender, _source, _destination, block.timestamp));
        requests[requestId] = CircuitRequest(
            requestId, msg.sender, _source, _destination, _bandwidth, 
            _policyIds, _policyNames, _policyDescriptions,
            _startTime, _endTime, _recurring, _path,
            "pending", block.timestamp, false
        );
        
        emit CircuitRequested(
            requestId, msg.sender, _source, _destination, _bandwidth, 
            _policyIds, _policyNames, _policyDescriptions, _startTime, _endTime, 
            _recurring, _path, "pending"
        );
    }
    
    function approveCircuit(bytes32 _id) public {
        require(requests[_id].approved == false, "Circuito já foi aprovado");
        
        CircuitRequest storage req = requests[_id];
        req.approved = true;
        req.status = "approved";
        
        emit CircuitApproved(
            req.id, 
            req.requester, 
            req.source, 
            req.destination, 
            req.bandwidth, 
            req.policyIds, 
            req.startTime,
            req.endTime,
            req.recurring,
            req.path,
            req.status,
            req.timestamp
        );
    }
    
    function rejectCircuit(bytes32 _id) public {
        require(requests[_id].approved == false, "Circuito já foi processado");
        requests[_id].status = "rejected";
        emit CircuitRejected(_id);
    }
    
    function getCircuitRequest(bytes32 _id) public view returns (
        bytes32, address, string memory, string memory, uint, 
        bytes32[] memory, string[] memory, string[] memory, 
        uint, uint, bool, string memory, string memory, uint, bool
    ) {
        CircuitRequest memory req = requests[_id];
        return (
            req.id, req.requester, req.source, req.destination, req.bandwidth, 
            req.policyIds, req.policyNames, req.policyDescriptions,
            req.startTime, req.endTime, req.recurring, req.path,
            req.status, req.timestamp, req.approved
        );
    }
}
