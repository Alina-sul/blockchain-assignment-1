
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
