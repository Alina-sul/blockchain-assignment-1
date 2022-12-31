const crypto = require('crypto');
const SHA256 = require('crypto-js/sha256');
const { BloomFilter } = require('bloom-filters');
const { MerkleTree } = require('merkletreejs');

class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.nonce = 0;
        this.hash = this.calculateHash();
        // Adding new bloom filter object
        this.bloomFilter = new BloomFilter(10, 4);
        // Running merkle tree method
        this.createMerkleTree(transactions);
    }

    createMerkleTree(transactions) {
        const leaves = transactions.map((x) => SHA256(x.signature));
        this.merkleTree = new MerkleTree(leaves, SHA256);
        this.root = this.merkleTree.getRoot().toString('hex');
    }

    createBloomFilter(transactions) {
        transactions.forEach((transaction) => {
            if (transaction.fromAddress != null)
                this.bloomFilter.add(transaction.signature);
            return;
        });
    }

    calculateHash() {
        return crypto
            .createHash('sha256')
            .update(
                this.previousHash +
                this.timestamp +
                JSON.stringify(this.transactions) +
                this.nonce
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

    // search in bloom filter
    isInBloomFilter(signature) {
        return this.bloomFilter.has(signature);
    }

    // search in merkle tree
    isInMerkleTree(signature) {
        const leaf = SHA256(signature);
        const proof = this.merkleTree.getProof(leaf);
        return this.merkleTree.verify(proof, leaf, this.root);
    }
}

module.exports.Block = Block;
