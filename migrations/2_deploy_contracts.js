const MEICANRequestManager = artifacts.require("MEICANRequestManager");
const FileRegistry = artifacts.require("FileRegistry");

module.exports = function (deployer) {
  deployer.deploy(MEICANRequestManager);
  deployer.deploy(FileRegistry);
};
