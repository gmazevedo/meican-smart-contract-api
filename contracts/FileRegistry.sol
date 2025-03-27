// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FileRegistry {
    struct FileRecord {
        address uploader;
        uint256 timestamp;
    }

    // Mapeia um hash para os dados de quem registrou
    mapping(bytes32 => FileRecord) public files;

    event FileRegistered(bytes32 hash, address uploader, uint256 timestamp);

    function registerFileHash(bytes32 fileHash) public {
        require(fileHash != bytes32(0), "Invalid Hash");
        require(files[fileHash].timestamp == 0, "This file has been already registered");

        files[fileHash] = FileRecord({
            uploader: msg.sender,
            timestamp: block.timestamp
        });

        emit FileRegistered(fileHash, msg.sender, block.timestamp);
    }

    function isFileRegistered(bytes32 fileHash) public view returns (bool) {
        return files[fileHash].timestamp != 0;
    }

    function getFileUploader(bytes32 fileHash) public view returns (address) {
        require(isFileRegistered(fileHash), "File not registered");
        return files[fileHash].uploader;
    }

    function getFileTimestamp(bytes32 fileHash) public view returns (uint256) {
        require(isFileRegistered(fileHash), "File not registered");
        return files[fileHash].timestamp;
    }
}
