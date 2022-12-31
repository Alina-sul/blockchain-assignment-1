
const {wallet,fullNodeWallet}= require("../wallets");
const{ CONSTANTS: {TRANSACTIONS_NUMBER}}=require("./constants");


function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const transactions = [];

for (let i = 0; i < TRANSACTIONS_NUMBER; i++) {
  const randomBoolean = Math.random() < 0.5;

  transactions.push({
    fromAddress: randomBoolean ? wallet : WALLET_2,
    toAddress: randomBoolean ? WALLET_2 : WALLET_1,
    amount: randomInteger(5, 20)
  });
}

// print pretty json
const jsonContent = JSON.stringify(transactions, null, 2);

fs.writeFile('initial_transactions_data.json', jsonContent, 'utf8', function (err) {
  if (err) {
    console.log('An error occurred while writing JSON Object to File.');
    return console.log(err);
  }

  console.log('JSON file has been saved.');
});