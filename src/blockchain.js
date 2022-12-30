const crypto = require('crypto');
const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const { BloomFilter } = require('bloom-filters');
const { MerkleTree } = require('merkletreejs');

class Transaction {
    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
    }

    calculateHash() {
        return crypto
            .createHash('sha256')
            .update(
                this.fromAddress + this.toAddress + this.amount + this.timestamp
            )
            .digest('hex');
    }

    setSignature(signature) {
        this.signature = signature;
    }
    setDate(date) {
        this.timestamp = date;
    }

    signTransaction(signingKey) {
        if (signingKey.getPublic('hex') !== this.fromAddress) {
            throw new Error('You cannot sign transactions for other wallets!');
        }

        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');

        this.signature = sig.toDER('hex');
    }

    isValid() {
        if (this.fromAddress === null) return true;

        if (!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

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

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 20;
    }

    static blockChainLength = 0;

    createGenesisBlock() {
        Blockchain.blockChainLength++;
        return new Block(Date.parse('2017-01-01'), [], '0');
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    //block mine 4 transactions
    minePendingTransactions(miningRewardAddress) {
        const rewardTx = new Transaction(
            null,
            miningRewardAddress,
            this.miningReward
        );
        this.pendingTransactions.push(rewardTx);

        this.blockTransactions = [];

        // adding 4 transactions to block
        for (let i = 0; i < 3; i++) {
            if (this.pendingTransactions[i] != undefined) {
                this.blockTransactions.push(this.pendingTransactions[i]);
            }
        }

        this.blockTransactions.push(rewardTx);

        const block = new Block(
            Date.now(),
            this.blockTransactions,
            this.getLatestBlock().hash
        );

        block.mineBlock(this.difficulty);
        // Adding transactions to Bloom filter
        block.createBloomFilter(this.blockTransactions);
        // Adding transactions to merkle tree
        block.createMerkleTree(this.blockTransactions);

        this.chain.push(block);
        Blockchain.blockChainLength++;
        this.pendingTransactions = [];
    }

    addTransaction(transaction) {
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to address');
            return;
        }

        // Verify the transaction
        if (!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to chain');
            return;
        }

        if (transaction.amount <= 0) {
            throw new Error('Transaction amount should be higher than 0');
            return;
        }

        // Making sure that the amount sent is not greater than existing balance
        const walletBalance = this.getBalanceOfAddress(transaction.fromAddress);
        if (walletBalance < transaction.amount) {
            throw new Error('Not enough balance');
            return;
        }

        // Get all other pending transactions for the "from" wallet
        const pendingTxForWallet = this.pendingTransactions.filter(
            (tx) => tx.fromAddress === transaction.fromAddress
        );

        // If the wallet has more pending transactions, calculate the total amount
        // of spend coins so far. If this exceeds the balance, we refuse to add this
        // transaction.
        if (pendingTxForWallet.length > 0) {
            const totalPendingAmount = pendingTxForWallet
                .map((tx) => tx.amount)
                .reduce((prev, curr) => prev + curr);

            const totalAmount = totalPendingAmount + transaction.amount;
            if (totalAmount > walletBalance) {
                throw new Error(
                    'Pending transactions for this wallet is higher than its balance.'
                );
                return;
            }
        }

        this.pendingTransactions.push(transaction);
    }

    transactionIsFound(transaction) {
        let i = 0;
        let found = false;
        this.chain.forEach((block) => {
            if (block.isInBloomFilter(transaction)) {
                if (block.isInMerkleTree(transaction)) {
                    console.log(
                        'The transaction is located in block number : ' +
                            i +
                            '.'
                    );
                    return (found = true);
                }
            }
            i++;
        });

        console.log("The transaction wasn't found");
        return found;
    }

    getBalanceOfAddress(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }

                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
        }

        return balance;
    }

    getAllTransactionsForWallet(address) {
        const txs = [];

        for (const block of this.chain) {
            for (const tx of block.transactions) {
                if (tx.fromAddress === address || tx.toAddress === address) {
                    txs.push(tx);
                }
            }
        }

        return txs;
    }

    isChainValid() {
        // Check if the Genesis block hasn't been tampered with by comparing
        // the output of createGenesisBlock with the first block on our chain
        const realGenesis = JSON.stringify(this.createGenesisBlock());

        if (realGenesis !== JSON.stringify(this.chain[0])) {
            return false;
        }

        // Check the remaining blocks on the chain to see if there hashes and
        // signatures are correct
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (previousBlock.hash !== currentBlock.previousHash) {
                return false;
            }

            if (!currentBlock.hasValidTransactions()) {
                return false;
            }

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }
        }

        return true;
    }

    calculateBurnedCoins() {
        let total = 0;
        this.chain.forEach((block) => {
            block.transactions.forEach((transaction) => {
                if (transaction.toAddress === 'Burning Address')
                    total += transaction.amount;
            });
        });
        return total;
    }

    calculateMinedCoins() {
      let total = 0;
      this.chain.forEach((block) => {
        block.transactions.forEach((transaction) => {
          if (transaction.fromAddress === null)
            total += transaction.amount;
        });
      });
      return total;
    }
}

module.exports.Blockchain = Blockchain;
module.exports.Block = Block;
module.exports.Transaction = Transaction;
