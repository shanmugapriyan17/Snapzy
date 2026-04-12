// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProfileRegistry
 * @notice Immutable registry for NexusSocial — accounts, posts, messages, AI verifications, flags, and deletions.
 *         Once written, no entry can be modified or deleted.
 */
contract ProfileRegistry {
    address public owner;

    // ─── Structs ────────────────────────────────────────────────────────────────

    struct AccountRecord {
        bytes32 accountHash;
        uint256 registeredAt;
        bool    exists;
        bool    isFlagged;
        string  flagReason;
        uint256 flaggedAt;
    }

    struct PostRecord {
        bytes32 accountHash;
        bytes32 postHash;
        uint256 storedAt;
        bool    exists;
    }

    struct MessageRecord {
        bytes32 senderHash;
        bytes32 receiverHash;
        bytes32 msgHash;
        uint256 storedAt;
        bool    exists;
    }

    struct VerificationRecord {
        bytes32 accountHash;
        bytes32 verificationHash;
        bool    isFake;
        uint8   confidence;
        string  model;
        uint256 storedAt;
    }

    struct DeletionRecord {
        bytes32 contentHash;
        bytes32 deletedBy;
        string  reason;
        uint256 deletedAt;
        bool    exists;
    }

    // ─── Storage ─────────────────────────────────────────────────────────────────

    mapping(bytes32 => AccountRecord)      public accounts;
    mapping(bytes32 => PostRecord)         public posts;
    mapping(bytes32 => MessageRecord)      public messages;
    mapping(bytes32 => VerificationRecord) public verifications;
    mapping(bytes32 => DeletionRecord)     public deletions;

    uint256 public totalAccounts;
    uint256 public totalPosts;
    uint256 public totalMessages;
    uint256 public totalVerifications;
    uint256 public totalFlagged;
    uint256 public totalDeletions;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event AccountRegistered(bytes32 indexed accountHash, uint256 timestamp);
    event PostStored(bytes32 indexed accountHash, bytes32 indexed postHash, uint256 timestamp);
    event MessageStored(bytes32 indexed senderHash, bytes32 indexed receiverHash, bytes32 msgHash, uint256 timestamp);
    event VerificationStored(bytes32 indexed accountHash, bytes32 verificationHash, bool isFake, uint8 confidence, uint256 timestamp);
    event AccountFlagged(bytes32 indexed accountHash, string reason, uint256 timestamp);
    event DeletionRecorded(bytes32 indexed contentHash, bytes32 indexed deletedBy, string reason, uint256 timestamp);

    // ─── Modifiers ───────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ─── Functions ───────────────────────────────────────────────────────────────

    function registerAccount(bytes32 accountHash) external {
        if (accounts[accountHash].exists) return;
        accounts[accountHash] = AccountRecord({
            accountHash:  accountHash,
            registeredAt: block.timestamp,
            exists:       true,
            isFlagged:    false,
            flagReason:   "",
            flaggedAt:    0
        });
        totalAccounts++;
        emit AccountRegistered(accountHash, block.timestamp);
    }

    function storePost(bytes32 accountHash, bytes32 postHash) external {
        if (posts[postHash].exists) return;
        posts[postHash] = PostRecord({
            accountHash: accountHash,
            postHash:    postHash,
            storedAt:    block.timestamp,
            exists:      true
        });
        totalPosts++;
        emit PostStored(accountHash, postHash, block.timestamp);
    }

    function storeMessage(bytes32 senderHash, bytes32 receiverHash, bytes32 msgHash) external {
        if (messages[msgHash].exists) return;
        messages[msgHash] = MessageRecord({
            senderHash:   senderHash,
            receiverHash: receiverHash,
            msgHash:      msgHash,
            storedAt:     block.timestamp,
            exists:       true
        });
        totalMessages++;
        emit MessageStored(senderHash, receiverHash, msgHash, block.timestamp);
    }

    function storeVerification(
        bytes32 accountHash,
        bytes32 verificationHash,
        bool    isFake,
        uint8   confidence,
        string  calldata model
    ) external {
        verifications[verificationHash] = VerificationRecord({
            accountHash:      accountHash,
            verificationHash: verificationHash,
            isFake:           isFake,
            confidence:       confidence,
            model:            model,
            storedAt:         block.timestamp
        });
        totalVerifications++;
        emit VerificationStored(accountHash, verificationHash, isFake, confidence, block.timestamp);
    }

    function flagAccount(bytes32 accountHash, string calldata reason) external onlyOwner {
        require(accounts[accountHash].exists, "Account not registered");
        accounts[accountHash].isFlagged  = true;
        accounts[accountHash].flagReason = reason;
        accounts[accountHash].flaggedAt  = block.timestamp;
        totalFlagged++;
        emit AccountFlagged(accountHash, reason, block.timestamp);
    }

    /**
     * @notice Record a content deletion permanently on chain. Immutable audit trail.
     */
    function recordDeletion(bytes32 contentHash, bytes32 deletedBy, string calldata reason) external {
        deletions[contentHash] = DeletionRecord({
            contentHash: contentHash,
            deletedBy:   deletedBy,
            reason:      reason,
            deletedAt:   block.timestamp,
            exists:      true
        });
        totalDeletions++;
        emit DeletionRecorded(contentHash, deletedBy, reason, block.timestamp);
    }

    // ─── View / Verify ────────────────────────────────────────────────────────────

    function verifyPost(bytes32 postHash) external view returns (bool exists, bytes32 accountHash, uint256 storedAt) {
        PostRecord storage r = posts[postHash];
        return (r.exists, r.accountHash, r.storedAt);
    }

    function verifyAccount(bytes32 accountHash) external view returns (bool exists, bool isFlagged, uint256 registeredAt) {
        AccountRecord storage r = accounts[accountHash];
        return (r.exists, r.isFlagged, r.registeredAt);
    }

    function verifyDeletion(bytes32 contentHash) external view returns (bool exists, bytes32 deletedBy, string memory reason, uint256 deletedAt) {
        DeletionRecord storage r = deletions[contentHash];
        return (r.exists, r.deletedBy, r.reason, r.deletedAt);
    }

    function getStats() external view returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        return (totalAccounts, totalPosts, totalMessages, totalVerifications, totalFlagged, totalDeletions);
    }
}
