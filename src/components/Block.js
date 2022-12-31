const crypto = require('crypto');
const SHA256 = require('crypto-js/sha256');
const { BloomFilter } = require('bloom-filters');
const { MerkleTree } = require('merkletreejs');
const {
    CONSTANTS: { BF_ERROR_RATE },
} = require('../lib/constants');

class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.nonce = 0;
        this.hash = this.calculateHash();

        // merkle-tree initialization:
        const leaves = transactions.map((transaction) =>
            transaction.calculateHash()
        );
        this.merkleTree = new MerkleTree(leaves, SHA256);
        this.root = this.merkleTree.getRoot().toString('hex');

        // bloom-filter initialization:
        this.bloomFilter = BloomFilter.from(leaves, BF_ERROR_RATE);
    }

    calculateHash() {
        return crypto
            .createHash('sha256')
            .update(
                this.previousHash +
                    this.timestamp +
                    JSON.stringify(this.transactions) +
                    this.nonce +
                    this.root
            )
            .digest('hex');
    }

    mineBlock(difficulty) {
        while (
            this.hash.substring(0, difficulty) !==
            Array(difficulty + 1).join('0')
        ) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
    }

    hasValidTransactions() {
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }
        return true;
    }

    hasTransactionInBlock(transaction) {
        const txHash = transaction.calculateHash();
        // first search in bloom filter
        const bloomFilterResult = this.bloomFilter.has(txHash);
        if (!bloomFilterResult) return false;

        // if bloom-filter returns true, check merkle tree
        const proof = this.merkleTree.getProof(txHash);
        return this.merkleTree.verify(proof, txHash, this.root);
    }
}

module.exports.Block = Block;
