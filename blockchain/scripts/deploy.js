const hre = require("hardhat");
const path = require("path");
const fs   = require("fs");

async function main() {
  console.log("Deploying ProfileRegistry...");
  const Registry = await hre.ethers.getContractFactory("ProfileRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  const artifact = hre.artifacts.readArtifactSync("ProfileRegistry");

  console.log("ProfileRegistry deployed at:", address);

  // Write contract config to backend automatically
  const outPath = path.resolve(__dirname, "../../backend/config/contract.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ address, abi: artifact.abi }, null, 2));
  console.log("Contract config written to backend/config/contract.json");
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
