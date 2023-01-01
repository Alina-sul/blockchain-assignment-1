const topology = require('fully-connected-topology');
const { fullNodeWallet, wallet } = require('../wallets');
const {
    extractMessage,
    extractPeersAndMyPort,
    extractPortFromIp,
    formatMessage,
    getPeerIps,
    toLocalIp,
} = require('./utils');

const sockets = {};
const wallets = {};

// port --> wallet Map object
const portToWallet = new Map();
portToWallet.set('2000', fullNodeWallet);
portToWallet.set('3000', wallet);

const { me: myPort, peers } = extractPeersAndMyPort();

console.log('---------------------');
console.log('Welcome server!');
console.log('my port - ', myPort);
console.log('peers to connect are - ', peers);
console.log('connecting to peers...');

const myIp = toLocalIp(myPort);
const peerIps = getPeerIps(peers);





