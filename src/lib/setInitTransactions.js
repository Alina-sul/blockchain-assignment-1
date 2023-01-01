const fs = require('fs');
const { wallet1, wallet2 } = require('../wallets');
const {
    CONSTANTS: { TRANSACTIONS_NUMBER },
} = require('./constants');

function setInitTransactions() {
    function randomInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const transactions = [];

    for (let i = 0; i < TRANSACTIONS_NUMBER; i++) {
        const randomBoolean = Math.random() < 0.5;

        transactions.push({
            fromAddress: randomBoolean ? wallet1.publicKey : wallet2.publicKey,
            toAddress: randomBoolean ? wallet2.publicKey : wallet1.publicKey,
            amount: randomInteger(5, 20),
        });
    }

    const jsonContent = JSON.stringify(transactions, null, 2);

    return new Promise((resolve) => {
        fs.writeFile(
            'src/lib/transactions.json',
            jsonContent,
            'utf8',
            function (err) {
                if (err) {
                    console.log(
                        'An error occurred while writing JSON Object to File.'
                    );
                    return console.log(err);
                }

                console.log('JSON file has been saved.');
            }
        );
        resolve('JSON file has been saved.');
    });
}

module.exports.setInitTransactions = setInitTransactions;
