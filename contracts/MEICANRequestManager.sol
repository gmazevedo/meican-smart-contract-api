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
        address requester, 
        CircuitParams params,
        string status,
        uint timestamp
    );
    
    event CircuitRejected(bytes32 id);
    
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
            requestId, msg.sender, params, "pending", block.timestamp, false
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
    
    function approveCircuit(bytes32 _id) public {
        require(requests[_id].approved == false, "Circuit has already been approved");
        
        CircuitRequest storage req = requests[_id];
        req.approved = true;
        req.status = "approved";
        
        emit CircuitApproved(
            req.id, 
            req.requester, 
            req.params,
            req.status,
            req.timestamp
        );
    }
    
    function rejectCircuit(bytes32 _id) public {
        require(requests[_id].approved == false, "Circuit has already been processed");
        requests[_id].status = "rejected";
        emit CircuitRejected(_id);
    }
    
    function getCircuitRequest(bytes32 _id) public view returns (CircuitRequest memory) {
        //bytes32, address, string memory, string memory, uint, bytes32[] memory, string[] memory, string[] memory, uint, uint, bool, string memory, string memory, uint, bool
   // ) {
        //CircuitRequest memory req = requests[_id];
        /*return (
        requests[_id].id,
        requests[_id].requester,
        requests[_id].params.source,
        requests[_id].params.destination,
        requests[_id].params.bandwidth,
        requests[_id].params.policyIds,
        requests[_id].params.policyDescriptions,
        requests[_id].params.startTime,
        requests[_id].params.endTime,
        requests[_id].params.recurring,
        requests[_id].params.path,
        requests[_id].status,
        requests[_id].timestamp,
        requests[_id].approved
        );*/
        return requests[_id];
    }

}
