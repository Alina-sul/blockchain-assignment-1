const { generateKeys } = require("../lib/keygenerator");

class Wallet {
    constructor() {
        this.initializeKeys();
    }

    initializeKeys() {
        const { publicKey, privateKey } = generateKeys();
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }
}

module.exports.Wallet = Wallet;
