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
    await fullNodesBlockChain.setInitialBalance(wallet1);
    await fullNodesBlockChain.setInitialBalance(wallet2);
    console.log('Initial balance is set.\n');

    // add transactions from memPool
    console.log('Adding transactions from mem pool\n');
    const jsonData = fs.readFileSync('src/lib/transactions.json');
    const parsedData = JSON.parse(jsonData.toString());
    const defaultTransactions = parsedData;

    const walletsMap = new Map();
    walletsMap.set(wallet1.publicKey, wallet1);
    walletsMap.set(wallet2.publicKey, wallet2);

    for (let i = 0; i < defaultTransactions.length; i = i + 4) {
        for (let j = i; j <= i + 3; j++) {
            const tx = defaultTransactions[j];
            if (tx != undefined) {
                const transaction = new Transaction(
                    tx.fromAddress,
                    tx.toAddress,
                    tx.amount
                );
                const keyPair = ec.keyFromPrivate(
                    walletsMap.get(tx.fromAddress).privateKey
                );

                transaction.setDate(tx.timestamp);
                transaction.signTransaction(keyPair);
                fullNodesBlockChain.addTransaction(transaction);
            }
        }
        fullNodesBlockChain.minePendingTransactions(fullNodeKey);
    }

    return { fullNodesBlockChain };
}

module.exports.setUpFullNodes = setUpFullNodes;
