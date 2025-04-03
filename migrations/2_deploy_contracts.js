const MEICANRequestManager = artifacts.require("MEICANRequestManager");

module.exports = function (deployer) {
  deployer.deploy(MEICANRequestManager);
};
