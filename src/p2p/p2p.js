const {fullNodeWallet, wallet} = require('../wallets');

// port --> wallet Map object
const portToWallet = new Map();
portToWallet.set('2000', fullNodeWallet);
portToWallet.set('3000', wallet);




