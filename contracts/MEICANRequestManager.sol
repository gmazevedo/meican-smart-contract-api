// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MEICANRequestManager {

    int8 public constant STATUS_PENDING = 0;
    int8 public constant STATUS_APPROVED = 1;
    int8 public constant STATUS_REJECTED = -1; 
    
    address public owner;
    mapping(address => bool) public isAdmin;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner.");
        _;
    }

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Only admins.");
        _;
    }

    constructor() {
        owner = msg.sender;
        isAdmin[msg.sender] = true;
    }

    function addAdmin(address newAdmin) external onlyOwner {
        require(!isAdmin[newAdmin], "Is already admin.");
        isAdmin[newAdmin] = true;
    }

    function removeAdmin(address admin) external onlyOwner {
        require(isAdmin[admin], "Is not an admin.");
        isAdmin[admin] = false;
    }

    struct CircuitParams {
        string source;
        string destination;
        uint bandwidth;
        uint startTime;
        uint endTime;
        string description;
        string userPublicKey;
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
        string description,
        string userPublicKey,
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
        string memory description,
        string memory userPublicKey
    ) public returns (bytes32) {
        bytes32 requestId = keccak256(abi.encodePacked(msg.sender, source, destination, block.timestamp));
        
        CircuitParams memory params = CircuitParams(
            source, destination, bandwidth, startTime, endTime, description, userPublicKey
        );

        requests[requestId] = CircuitRequest(
            requestId, msg.sender, params, STATUS_PENDING, block.timestamp, false, 0, ''
        );
        
        emit CircuitRequested(
                requestId,
                msg.sender,
                source,
                destination,
                bandwidth,
                startTime,
                endTime,
                description,
                userPublicKey,
                STATUS_PENDING
                );

        return requestId;
    }
    
    function approveCircuit(
        bytes32 id,
        bytes32 policyHash,
        string memory policyLink
    ) public onlyAdmin {
        require(requests[id].requester != address(0), "This request does not exist.");
        require(requests[id].status == STATUS_PENDING, "Request has already been processed.");


        requests[id].status = STATUS_APPROVED;
        requests[id].policyHash = policyHash;
        requests[id].policyLink = policyLink;

        emit CircuitApproved(id, policyHash, policyLink);
    }
    
    function rejectCircuit(        
        bytes32 id,
        bytes32 policyHash,
        string memory policyLink
    ) public onlyAdmin {
        require(requests[id].requester != address(0), "This request does not exist.");
        require(requests[id].status == STATUS_PENDING, "Request has already been processed.");

        requests[id].status = STATUS_REJECTED;
        requests[id].policyLink = policyLink;
        requests[id].policyHash = policyHash;

        emit CircuitRejected(id, policyHash, policyLink);
    }
    
    function getCircuitRequest(bytes32 _id) public view returns (CircuitRequest memory) {
        return requests[_id];
    }

}
