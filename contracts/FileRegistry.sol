// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FileRegistry {
    struct FileRecord {
        address uploader;
        uint256 timestamp;
        string link;
    }

    mapping(bytes32 => FileRecord) public files;

    event FileRegistered(bytes32 hash, address uploader, uint256 timestamp, string link);

    function registerFileHash(bytes32 fileHash, string memory link) public {
        require(fileHash != bytes32(0), "Invalid Hash");
        require(files[fileHash].timestamp == 0, "This file has already been registered");

        files[fileHash] = FileRecord({
            uploader: msg.sender,
            timestamp: block.timestamp,
            link: link
        });

        emit FileRegistered(fileHash, msg.sender, block.timestamp, link);
    }

    function getFileUploader(bytes32 fileHash) public view returns (address) {
        require(files[fileHash].timestamp != 0, "File not registered");
        return files[fileHash].uploader;
    }

    function getFileTimestamp(bytes32 fileHash) public view returns (uint256) {
        require(files[fileHash].timestamp != 0, "File not registered");
        return files[fileHash].timestamp;
    }

    function getFileLink(bytes32 fileHash) public view returns (string memory) {
        require(files[fileHash].timestamp != 0, "File not registered");
        return files[fileHash].link;
    }
}