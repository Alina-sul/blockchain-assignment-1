const fs = require('fs');
const EC = require('elliptic').ec;
const { wallet1, wallet2, fullNodeWallet } = require('./wallets');
const { Blockchain } = require('./classes/Blockchain');
const { Transaction } = require('./classes/Transaction');

const ec = new EC('secp256k1');

async function setUpFullNodes() {
    // fullNode private key
    const fullNodeKey = ec.keyFromPrivate(fullNodeWallet.privateKey);

    // fullNode public key
    const fullNodeAddress = fullNodeKey.getPublic('hex');

    // new blockchain instance
    const fullNodesBlockChain = new Blockchain(fullNodeAddress);

    // mine Genesis block
    fullNodesBlockChain.minePendingTransactions();
    console.log('Genesis block mined\n');

    // fill initial balances on wallets
    console.log('Setting initial balance to blocks...\n');
    // TODO: fix infinite loop :'(
    await fullNodesBlockChain.setInitialBalance(wallet1);
    await fullNodesBlockChain.setInitialBalance(wallet2);

    // add transactions from memPool
    const jsonData = fs.readFileSync('./lib/transactions.js');
    const parsedData = JSON.parse(jsonData);
    const defaultTransactions = parsedData;

    for (let i = 0; i < defaultTransactions.length; i = i +4) {
        for (let j = i; j <= i + 3; j++) {

            const txn = defaultTransactions[j];
            if(txn!=undefined){
                const transaction = new Transaction(txn.fromAddress, txn.toAddress, txn.amount);
                transaction.setSignature(txn.signature);
                transaction.setDate(txn.timestamp);
                fullNodesBlockChain.addTransaction(transaction);
            }

        }
        fullNodesBlockChain.minePendingTransactions(fullNodeKey);
    }
}

module.exports.setUpFullNodes = setUpFullNodes;
