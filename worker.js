const solanaWeb3 = require('@solana/web3.js');
const {Keypair} = require("@solana/web3.js")
const csv = require('csv-parser');
const fs = require('fs');
const bs58 = require('bs58');

const throng = require('throng');
const Queue = require('bull');


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

let REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
let workers = process.env.WEB_CONCURRENCY || 1;
let maxJobsPerWorker = 1;

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function start() {

    let workQueue = new Queue('work', REDIS_URL);

    workQueue.process(maxJobsPerWorker, async (job) => {
        let balance = await shieldStart(shieldedAccount);
    });

}

//init clustered workers
throng({ workers, start});

async function shieldStart(keypair) {
    console.log('Getting Balance...');

    let publicKey = keypair.publicKey;

    if (publicKey !== null) {
            try {
                const getBalance = await connection.getBalance(publicKey);
                const balance = getBalance/1000000000;

                if (balance > 0) {
                    console.log(publicKey + ' => '+ balance)
                    if (balance > 0.000005) {
                        let fee = 5000; //lamports
                        shieldTransaction(balance * 1000000000 - fee, shieldedAccount, recoveryAccount);
                        await sleep(1000);
                    } 
                } else {
                    console.log('Balance: ' + balance + ' - do nothing');
                }
    
            } catch (err) {
                console.log('Could not retrieve wallet balance.');
                console.log('Attempting again…');
                console.log(err);
            }            
        }

await sleep(500);
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
        console.log(result);
        console.log('Back to watching...');
        return amount / 1000000000;
    } catch(err) {
        console.log('Cannot transfer funds, probably not enough SOL.');
    }

}



