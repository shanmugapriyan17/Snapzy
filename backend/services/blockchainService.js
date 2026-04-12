const { ethers } = require('ethers');
const fs         = require('fs');
const path       = require('path');

let contract = null;
let provider = null;

function init() {
  try {
    const cfgPath = path.resolve(__dirname, '../config/contract.json');
    if (!fs.existsSync(cfgPath)) {
      console.warn('[Blockchain] contract.json not found — blockchain disabled until deployed');
      return;
    }
    const { address, abi } = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    contract = new ethers.Contract(address, abi, wallet);
    console.log('[Blockchain] Connected to ProfileRegistry at', address);
  } catch (err) {
    console.warn('[Blockchain] Init failed:', err.message);
  }
}

async function safeCall(fn) {
  if (!contract) return null;
  try { return await fn(contract); }
  catch (err) { console.warn('[Blockchain] TX failed:', err.message); return null; }
}

const blockchainService = {
  init,
  isReady: () => !!contract,

  async registerAccount(accountHash) {
    return safeCall(c => c.registerAccount(accountHash));
  },
  async storePost(accountHash, postHash) {
    return safeCall(c => c.storePost(accountHash, postHash));
  },
  async storeMessage(senderHash, receiverHash, msgHash) {
    return safeCall(c => c.storeMessage(senderHash, receiverHash, msgHash));
  },
  async storeVerification(accountHash, verificationHash, isFake, confidence, model) {
    return safeCall(c => c.storeVerification(accountHash, verificationHash, isFake, Math.round(confidence), model));
  },
  async flagAccount(accountHash, reason) {
    return safeCall(c => c.flagAccount(accountHash, reason));
  },
  async recordDeletion(contentHash, deletedByHash, reason) {
    return safeCall(c => c.recordDeletion(contentHash, deletedByHash, reason));
  },
  async verifyPost(postHash) {
    return safeCall(c => c.verifyPost(postHash));
  },
  async verifyAccount(accountHash) {
    return safeCall(c => c.verifyAccount(accountHash));
  },
  async verifyDeletion(contentHash) {
    return safeCall(c => c.verifyDeletion(contentHash));
  },
  async getStats() {
    return safeCall(c => c.getStats());
  }
};

module.exports = blockchainService;
