const { Wallet } = require('./classes/Wallet');

class Wallets {
    static fullNodeWallet = new Wallet();
    static wallet1 = new Wallet();
    static wallet2 = new Wallet();
}

console.log('Created fullNodeWallet', Wallets.fullNodeWallet);
console.log('Created wallet1', Wallets.wallet1);
console.log('Created wallet2', Wallets.wallet2);

module.exports.fullNodeWallet = Wallets.fullNodeWallet;
module.exports.wallet1 = Wallets.wallet1;
module.exports.wallet2 = Wallets.wallet2;
