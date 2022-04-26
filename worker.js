const solanaWeb3 = require('@solana/web3.js');
const {Keypair} = require("@solana/web3.js")
const fs = require('fs');
const bs58 = require('bs58');
const path = require('path');  require('dotenv').config({ path:path.join(__dirname, '.env') });
const twilio = require ('./twilio.js');
const redis = require('redis');

let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const subscriber = redis.createClient({url: process.env.REDIS_URL});
const pubsub = redis.createClient({url: process.env.REDIS_URL});
subscriber.connect();
pubsub.connect();


//var socket = io.connect('http://localhost:5100');

/** 
var port = process.env.PORT;
console.log('PORT:');
console.log(port);
var socket = require('socket.io-client')('http://localhost:' + port);
socket.on('connect', function(){ 
    console.log('Worker connected to socket.');
});
socket.on('event', function(data){});
socket.on('disconnect', function(){});
*/

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
let accountChangeListenerID;

start();

async function start() {
    await subscriber.set('shield_status', 'deactivated');
    await subscriber.set('set-next-action', 'none');

  

    twilio.sendSMS('Solana Shield Worker started. If you arent just setting this up, look into this.');
    console.log('Solana Shield Booting Up....');
    console.log('----------------------------');
    console.log('Protect account: %s', shieldedAccount.publicKey);
    console.log('Recovery account: %s', recoveryAccount);
    console.log('----------------------------');
    console.log('Solana Shield Initialized...Activate to start protecting.');
    console.log('----------------------------');

    subscribeToShieldStatus();
}

async function subscribeToShieldStatus() {
    console.log('Subscribed to Shield Status');
    await pubsub.subscribe('shield-status', (message) => {
        console.log('Shield Status subscription: ' + message);
        checkShieldStatus();
    });
}

async function unsubscribeToShieldStatus() {
    await pubsub.unsubscribe('shield-status').then(() => {
        console.log('Unsubscribed from Shield Status');
    });
}

async function checkShieldStatus() {
    let nextAction = await subscriber.get("set-next-action");

    if (nextAction !== currentStatus && nextAction === "activate") {
        activate();
    } else if (nextAction !== currentStatus && nextAction == "deactivate") {
        deactivate();
    }
}

async function deactivate() {
    try {
        await unsubscribeToShieldStatus();
        let isDeactivated = await subscriber.set("shield_status", "deactivated");
        let cancelNextAction = await subscriber.set("set-next-action", "none");
        await subscribeToShieldStatus();
        
        await connection.removeAccountChangeListener(accountChangeListenerID).then( function () {
            console.log('xxxx SHIELD DEACTIVATED xxxx');
            currentStatus = "deactivated";
            //socket.emit('log', 'Shield Deactivated.');
            twilio.sendSMS('Solana Shield Deactivated.');
        });

    } catch (err) {
        let isDeactivated = await subscriber.set("shield_status", "activated");
        console.log('Could not deactivate the shield for some reason.');
        console.log(err);
    }

}

async function activate() {
    try {
        console.log('||||| Shield Activated |||||');

        currentStatus = "activated";
        //Get current balance
        const balance = await connection.getBalance(shieldedAccount.publicKey);
        console.log('Current balance: %s', balance);
    
        checkBalanceToProtect(balance);

 
        //When new transaction is detected, run this
        accountChangeListenerID = connection.onAccountChange(
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

        await unsubscribeToShieldStatus();
        await subscriber.set('shield_status', 'activated');
        await subscriber.set('set-next-action', 'none');
        await subscribeToShieldStatus();
        //socket.emit('log', 'Shield Activated.');
        twilio.sendSMS('Solana Shield activated.');

    } catch (err) {
        await subscriber.set("shield_status", "disactivated");
        console.log('Could not activate shield for some reason.');
        console.log(err);
    }
   
}

async function checkBalanceToProtect(balance) {

    if (balance < 0.000005 && balance > 0) {
        console.log('We found SOL in your wallet, but its so tiny we cannot make a transaction');
    } else if (balance > 0.000005) {
        let fee = 5000; //lamports
        shieldTransaction(balance - fee, shieldedAccount, recoveryAccount);
    } else if (balance == 0) {
        console.log('No SOL exists in wallet, doing nothing.');
        console.log('Watching...');
    }
}

async function shieldTransaction(amount, shieldedAccountKeypair, recoveryAccount) {

    let attempt = 0;

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
        attempt++;
        let result = await solanaWeb3.sendAndConfirmTransaction(connection, transaction, [shieldedAccountKeypair])
        console.log('Shielded %d SOL', amount / 1000000000 );
        console.log('Transaction ID: %s', result);
        console.log('SOL balance is now 0. Suck it hackers.');
        //socket.emit('log', 'Shielded ' + amount / 1000000000 + 'SOL.');
        twilio.sendSMS('Solana Shield protected ' + amount / 1000000000 + ' SOL');
        twilio.sendSMS('https://solscan.io/' + result);

        addTotalShielded(amount / 1000000000);
        return amount / 1000000000;
    } catch(err) {
        console.log('Cannot transfer funds, probably not enough SOL. Trying to shield again.');
        if (attempt > 5) {
            shieldTransaction(amount - 5000, shieldedAccountKeypair, recoveryAccount);
        } else if (attempt > 50) {
            console.log(err);
            console.log('Could not shield. Maybe high network congestion.');
            twilio.sendSMS('Could not shield transaction. Check your server logs and SOL wallet immediately.');  
        } else {
            shieldTransaction(amount, shieldedAccountKeypair, recoveryAccount);
        }
    }

}

async function addTotalShielded(balance) {
    try {
        let currentTotalShielded = await subscriber.get('totalShielded');
        currentTotalShielded += balance;
        let result = await subscriber.set('totalShielded', currentTotalShielded);
    } catch (err) {
        console.log(err);
    }
}

function log(socket, data) {
    console.log(data);
    //socket.emit('log', data);
}


