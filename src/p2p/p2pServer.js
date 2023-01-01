const topology = require('fully-connected-topology');
const EC = require('elliptic').ec;
const { Transaction } = require('./classes/Transaction');
const { fullNodeWallet, wallet1, wallet2 } = require('../wallets');
const {setUpFullNodes} = require('../fullNodes');
const {
    extractMessage,
    extractPeersAndMyPort,
    extractPortFromIp,
    formatMessage,
    getPeerIps,
    toLocalIp,
} = require('./utils');

const ec = new EC('secp256k1');

const sockets = {};
const wallets = {};

// port --> wallet Map object
const portToWallet = new Map();
portToWallet.set('2000', fullNodeWallet);
portToWallet.set('3000', wallet1);
portToWallet.set('3000', wallet2);

const { me: myPort, peers } = extractPeersAndMyPort();

console.log('---------------------');
console.log('Welcome server!');
console.log('my port - ', myPort);
console.log('peers to connect are - ', peers);
console.log('connecting to peers...');

const myIp = toLocalIp(myPort);
const peerIps = getPeerIps(peers);

async function p2pServer() {
    const { fullNodesBlockChain } = await setUpFullNodes();

    // connect to peers
    let peer = topology(myIp, peerIps);

    peer.on('connection', (socket, peerIp) => {
        const peerPort = extractPortFromIp(peerIp);
        console.log('connected to peer - ', peerPort);
        sockets[peerPort] = socket;
        wallets[peerPort] = portToWallet[peerPort];
        const peerAddress = wallets[peerPort].publicKey;
        const peerPrivateKey = wallets[peerPort].privateKey;

        socket.on('data', (data) => {
            try {
                const rawMessage = data.toString('utf-8').trim();
                const message = extractMessage(rawMessage);
                if (!message) {
                    // validation
                    console.log('got invalid json msg from', peerPort);
                    return;
                }

                console.log('got msg from', peerPort);

                if (message.type === 'getBalanceOfAddress') {
                    const peerBalance = fullNodesBlockChain.getBalanceOfAddress(peerAddress);
                    socket.write(formatMessage({ type: 'balanceResponse', balance: peerBalance }));
                    return;
                }

                if (message.type === 'newTransaction') {
                    if (!message.to || !message.amount) {
                        console.log('transaction failed from', peerPort);
                        return;
                    }

                    const targetAddress = wallets[message.to]?.publicKey;
                    if (!targetAddress) {
                        console.log("can't transfer coins to unknown wallet address");
                        return;
                    }

                    let newTransaction = new Transaction(peerAddress, targetAddress, message.amount);
                    const keyPair = ec.keyFromPrivate(peerPrivateKey);
                    newTransaction.signTransaction(keyPair);
                    fullNodesBlockChain.addTransaction(newTransaction);
                    console.log('added new transaction of', message.amount, 'from', peerPort, 'to', message.to);
                    fullNodesBlockChain.minePendingTransactions();

                    socket.write(
                        formatMessage({
                            type: 'transactionAddDone',
                            from: peerPort,
                            to: message.to,
                            amount: message.amount
                        })
                    );
                    return;
                }
            } catch (err) {
                console.warn('Error:', err?.message);
            }
        });
    });

    process.on('SIGINT', () => {
        // pressed CTRL+C
        peer.destroy();
        console.log('\nSIGINT exiting...');
        process.exit();
    });
}

p2pServer().catch(console.error);



