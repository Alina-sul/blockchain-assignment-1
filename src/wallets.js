const { Wallet } = require("./components/wallet");

const fullNodeWallet = new Wallet();
const wallet = new Wallet();

console.log('fullNodeWallet', fullNodeWallet);
console.log('wallet', wallet);

module.exports.fullNodeWallet = fullNodeWallet;
module.exports.wallet = wallet;


