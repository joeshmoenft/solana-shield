const solanaWeb3 = require('@solana/web3.js');
const {Keypair} = require("@solana/web3.js")
const fs = require('fs');
const bs58 = require('bs58');
const path = require('path');  require('dotenv').config({ path:path.join(__dirname, '.env') });

const redis = require('redis');
console.log('Worker starting...');

let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const subscriber = redis.createClient({url: process.env.REDIS_URL});
subscriber.connect();

if (!process.env.NETWORK) {
    console.log('Please select a network in your ENV variables.'); //needs mainnet-beta or devnet
}

const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl(process.env.NETWORK), 'confirmed');

if (!process.env.SHIELDED_ACCOUNT_PRIVATE_KEY && !process.env.RECOVERY_ACCOUNT_ADDRESS) {
    console.log('Please set your ENV variables.');
    return;
}

let shieldedSecret = bs58.decode(process.env.SHIELDED_ACCOUNT_PRIVATE_KEY);

let shieldedAccount = Keypair.fromSecretKey(shieldedSecret);
let recoveryAccount = process.env.RECOVERY_ACCOUNT_ADDRESS;

let currentStatus = "deactivated";

start();

async function start() {
    setInterval(() => {
        checkShieldStatus();
    }, 1000);
}

async function checkShieldStatus() {
    let status = await subscriber.get("shield_status");

    if (status !== currentStatus && status == "activated") {
        activate();
    } else if (status !== currentStatus && status == "deactivated") {
        deactivate();
    }
}

async function deactivate() {
    console.log('xxxx SHIELD DEACTIVATED xxxx');
    currentStatus = "deactivated";
}

async function activate() {
    console.log('||||| Shield Activated |||||');

    currentStatus = "activated";
    //Get current balance
    const balance = await connection.getBalance(shieldedAccount.publicKey);
    console.log('Current balance: %s', balance);

    checkBalanceToProtect(balance);

    //When new transaction is detected, run this
    connection.onAccountChange(
        shieldedAccount.publicKey,
        ( updatedAccountInfo, context ) => {
            //when SOL value changes, do something
            let balance = updatedAccountInfo.lamports;
            if (balance !== 0) {
                checkBalanceToProtect(balance);
            }
        },
        'confirmed',
    );
}

async function checkBalanceToProtect(balance) {
    if (balance < 0.000005 && balance > 0) {
        console.log('We found SOL in your wallet, but its so tiny we cannot make a transaction');
    } else if (balance > 0.000005) {
        let fee = 5000; //lamports
        shieldTransaction(balance - fee, shieldedAccount, recoveryAccount);
    } else if (balance == 0) {
        console.log('No SOL exists in wallet, doing nothing.');
    }
}

async function shieldTransaction(amount, shieldedAccountKeypair, recoveryAccount) {

    //Create Simple Transaction
    let transaction = new solanaWeb3.Transaction();

    let recoveryAccountPK = new solanaWeb3.PublicKey(recoveryAccount);

    // Add an instruction to execute
    transaction.add(solanaWeb3.SystemProgram.transfer({
        fromPubkey: shieldedAccountKeypair.publicKey,
        toPubkey: recoveryAccountPK,
        lamports: amount,
    }));
    
    try {
        let result = await solanaWeb3.sendAndConfirmTransaction(connection, transaction, [shieldedAccountKeypair])
        console.log('Shielded %d SOL', amount / 1000000000 );
        console.log('Transaction ID: %s', result);
        console.log('SOL balance is now 0. Suck it hackers.');
        return amount / 1000000000;
    } catch(err) {
        console.log('Cannot transfer funds, probably not enough SOL.');
    }

}



