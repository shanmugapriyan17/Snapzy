require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

async function test() {
  const cfgPath = path.resolve(__dirname, './config/contract.json');
  console.log('Contract exists:', fs.existsSync(cfgPath));
  const { address, abi } = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  console.log('Address:', address);

  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
  const contract = new ethers.Contract(address, abi, wallet);

  try {
    const stats = await contract.getStats();
    console.log('Success!', stats);
  } catch (err) {
    console.error('TX failed:', err.message);
  }
}
test();
