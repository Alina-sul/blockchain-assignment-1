const { Wallet } = require("./classes/Wallet");

const fullNodeWallet = new Wallet();
const wallet1 = new Wallet();
const wallet2 = new Wallet();

console.log('Created fullNodeWallet', fullNodeWallet);
console.log('Created wallet1', wallet1);
console.log('Created wallet2', wallet2);

module.exports.fullNodeWallet = fullNodeWallet;
module.exports.wallet1 = wallet1;
module.exports.wallet2 = wallet2;


