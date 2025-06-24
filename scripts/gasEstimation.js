const MEICANRequestManager = artifacts.require("MEICANRequestManager");

module.exports = async function (callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const instance = await MEICANRequestManager.deployed();

    const fakePolicyHash = web3.utils.soliditySha3("fakePolicy");

    // ==============================
    // Teste: requestCircuit
    // ==============================
    const tx1 = await instance.requestCircuit(
      "source",
      "destination",
      100,
      0,
      1000,
      true,
      "path",
      "publicKey",
      { from: accounts[0] }
    );
    console.log("Gas usado na requestCircuit:", tx1.receipt.gasUsed);

    const requestId = tx1.logs[0].args.id;

    // Garantir que account[0] é admin
    const isAdmin = await instance.isAdmin(accounts[0]);
    if (!isAdmin) {
      await instance.addAdmin(accounts[0], { from: accounts[0] });
    }

    // ==============================
    // Teste: approveCircuit
    // ==============================
    const tx2 = await instance.approveCircuit(
      requestId,
      fakePolicyHash,
      "https://example.com/policy",
      { from: accounts[0] }
    );
    console.log("Gas usado na approveCircuit:", tx2.receipt.gasUsed);

    // ==============================
    // Teste: addAdmin
    // ==============================
    const newAdmin = accounts[1];
    const tx4 = await instance.addAdmin(newAdmin, { from: accounts[0] });
    console.log("Gas usado na addAdmin:", tx4.receipt.gasUsed);

    // ==============================
    // Teste: removeAdmin
    // ==============================
    const tx5 = await instance.removeAdmin(newAdmin, { from: accounts[0] });
    console.log("Gas usado na removeAdmin:", tx5.receipt.gasUsed);

    // ==============================
    // Teste: rejectCircuit em uma nova requisição
    // ==============================
    const txNewRequest = await instance.requestCircuit(
      "source2",
      "destination2",
      200,
      0,
      2000,
      true,
      "path2",
      "publicKey2",
      { from: accounts[0] }
    );
    const secondRequestId = txNewRequest.logs[0].args.id;

    const tx3 = await instance.rejectCircuit(
      secondRequestId,
      fakePolicyHash,
      "https://example.com/policy",
      { from: accounts[0] }
    );
    console.log("Gas usado na rejectCircuit:", tx3.receipt.gasUsed);

    callback();
  } catch (error) {
    console.error("Erro ao medir consumo de gas:", error);
    callback(error);
  }
};
