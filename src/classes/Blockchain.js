const { Block } = require('./Block');
const { Transaction } = require('./Transaction');

const {
    CONSTANTS: { TX_LIMIT_IN_BLOCK, INIT_BALANCE },
} = require('../lib/constants');

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 20;
        this.burnAddress = '0x0';
        this.burnedCoins = 0;
        this.minedCoins = 0;
    }

    createGenesisBlock() {
        return new Block(Date.parse('2009-01-03'), [], '0');
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress) {
        const blockTransactions = [];

        // reward transaction
        const rewardTx = new Transaction(
            null,
            miningRewardAddress,
            this.miningReward
        );

        // burn transaction
        const burnFee = this.chain.length;
        const burnTx = new Transaction(null, this.burnAddress, burnFee);

        // reduce -1 for rewardTx and -1 for burnTx that must be included
        for (let i = 0; i < TX_LIMIT_IN_BLOCK - 2; i++) {
            if (this.pendingTransactions[i]) {
                blockTransactions.push(this.pendingTransactions[i]);
            }
        }

        // push reward and burn transactions - both must be included in the block
        blockTransactions.push(rewardTx);
        blockTransactions.push(burnTx);

        // mine the block
        const block = new Block(
            Date.now(),
            blockTransactions,
            this.getLatestBlock().hash
        );
        block.mineBlock(this.difficulty);

        // calculate burned coins amount
        blockTransactions.forEach((burnTx) => {
            if (burnTx.toAddress === this.burnAddress)
                this.burnedCoins += burnTx.amount;
        });

        // calculate mined coins amount
        blockTransactions.forEach((minedTx) => {
            if (minedTx.fromAddress === null) this.minedCoins += minedTx.amount;
        });

        this.chain.push(block);

        // remove mined transaction - first one
        this.pendingTransactions = this.pendingTransactions.slice(3,this.pendingTransactions.length);
    }

    mineAllPendingTransactions() {
        return new Promise((resolve) => {
            while (this.pendingTransactions.length > 0) {
                this.minePendingTransactions();
            }
            resolve('Mined all transactions');
        });
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

    hasTransactionInBlockChain(transaction) {
        this.chain.forEach((block) => {
            if (block.hasTransactionInBlock(transaction)) {
                return true;
            }
            return false;
        });
    }

    async setInitialBalance(wallet) {
        const transaction = new Transaction(null, wallet, INIT_BALANCE);
        this.pendingTransactions.push(transaction);

        await this.mineAllPendingTransactions();
    }

    getBurnedCoinsSum() {
        return this.burnedCoins;
    }

    getMinedCoinsSum() {
        return this.minedCoins;
    }
}

module.exports.Blockchain = Blockchain;
