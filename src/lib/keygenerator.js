const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

// Generate a new key pair and convert them to hex-strings
function generateKeys() {
    const key = ec.genKeyPair();
    const publicKey = key.getPublic('hex');
    const privateKey = key.getPrivate('hex');

    return {
        publicKey,
        privateKey,
    };
}

module.exports.generateKeys = generateKeys;
