const solanaWeb3 = require('@solana/web3.js');
const {Keypair} = require("@solana/web3.js")
const bs58 = require('bs58');
const path = require('path'); require('dotenv').config({path: path.join(__dirname, '.env')});
const twilio = require('./src/includes/notifications.js');
const {promisify} = require('util');
const db = require('./src/includes/db.js');
const createSubscriber = require('pg-listen');

/* dev
const subscriber = createSubscriber({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});
*/

const subscriber = createSubscriber({
    connectionString: process.env.DATABASE_URL,
    ssl: { //ssl: false for dev
        rejectUnauthorized: false
    } 
});


subscriber.notifications.on('shield_update', msg => {
    if (msg == true && msg != currentStatus) {
        //console.log('activate it');
        activate();
    } else if (msg == false && msg !== currentStatus) {
        deactivate();
    }
});

subscriber.events.on('error', (error) => {
    console.log('Error: ', error);
});

subscriber.connect();
subscriber.listenTo('shield_update');



if (!process.env.NETWORK) {
    console.log('Please select a network in your ENV variables.'); //needs mainnet-beta or devnet
}



const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl(process.env.NETWORK), 'confirmed');

if (!process.env.SHIELDED_ACCOUNT_PRIVATE_KEY && !process.env.RECOVERY_ACCOUNT_ADDRESS) {
    throw new Error("Please set your ENV variables.");
}

let shieldedSecret = bs58.decode(process.env.SHIELDED_ACCOUNT_PRIVATE_KEY);
let shieldedAccount = Keypair.fromSecretKey(shieldedSecret);
let recoveryAccount = process.env.RECOVERY_ACCOUNT_ADDRESS;

//check to see if pubkey and recovery address are the same account to prevent draining
if (shieldedAccount.publicKey == recoveryAccount) {
    throw new Error("Your Shielded acccount and Recovery account cannot be the same.");
}

let currentStatus;
let accountChangeListenerID;


async function start() {

    await db.initDB().then ( (res, error) => {
        checkShieldOnStartup();
    });


    twilio.sendNotification('Solana Shield Worker started. If you arent just setting this up, look into this.');
    console.log('Solana Shield Booting Up....');
    console.log('----------------------------');
    console.log('Protect account: %s', shieldedAccount.publicKey);
    console.log('Recovery account: %s', recoveryAccount);
    console.log('----------------------------');
    console.log('Solana Shield Initialized...Activate to start protecting.');
    console.log('----------------------------');

}


async function checkShieldOnStartup() {

    await db.getShieldStatusDB().then( (res, err) => {
        console.log('Startup Shield Status DB: ' + res);
        currentStatus = res;
    });
    
    if (currentStatus) {
        activate();
    }

}

async function deactivate() {
    try {
        await connection.removeAccountChangeListener(accountChangeListenerID).then(function () {
            currentStatus = false;
            db.updateShieldStatusDB(false);
            console.log('Shield Deactivated.');
            twilio.sendNotification('Solana Shield Deactivated.');
        });
    } catch (err) {
        console.log('Could not deactivate the shield for some reason.');
        console.log(err);
    }

}

async function getSOLBalance() {
    const balance = await connection.getBalance(shieldedAccount.publicKey)
            .then((result) => {
                console.log('Current balance: %s', result)
                return result;
            })
            .catch((error) => {
                console.log('Error getting balance. Solana/API is probably down.');
                console.log(error); 
                return error;
            });
}

async function activate() {
    try {
        console.log('||||| Shield Activating... |||||');


        let balanceAttempts = 0;

        const balance = await getSOLBalance().catch((error) => {

            balanceAttempts++;
            //Try again 

            if (balanceAttempts < 20) {
                setTimeout(() => {
                    getSOLBalance();
            }, balanceAttempts * 10000);
            } 
        
        });

        checkBalanceToProtect(balance);

        //When new transaction is detected, run this
        accountChangeListenerID = await connection.onAccountChange(
            shieldedAccount.publicKey,
            (updatedAccountInfo, _) => {
                //when SOL value changes, do something
                let balance = updatedAccountInfo.lamports;
                if (balance !== 0) {
                    checkBalanceToProtect(balance);
                }
            },
            'confirmed',
        );

        console.log('Shield Activated.');
        twilio.sendNotification('Solana Shield activated.');

        currentStatus = true;
        db.updateShieldStatusDB(true);

    } catch (err) {
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
    let transaction = new solanaWeb3.Transaction();
    let recoveryAccountPK = new solanaWeb3.PublicKey(recoveryAccount);

    transaction.add(solanaWeb3.SystemProgram.transfer({
        fromPubkey: shieldedAccountKeypair.publicKey,
        toPubkey: recoveryAccountPK,
        lamports: amount,
    }));

    try {
        attempt++;
        let result = await solanaWeb3.sendAndConfirmTransaction(connection, transaction, [shieldedAccountKeypair])
        console.log('Shielded %d SOL', amount / 1000000000);
        console.log('Transaction ID: %s', result);
        console.log('SOL balance is now 0. Suck it hackers.');
        console.log('Shielded ' + amount / 1000000000 + 'SOL.');
        twilio.sendNotification('Solana Shield protected ' + amount / 1000000000 + ' SOL');
        twilio.sendNotification('https://solscan.io/tx/' + result);

        return amount / 1000000000;
    } catch (err) {
        console.log('Cannot transfer funds, probably not enough SOL or network is congestd. Trying to shield again.');
        console.log(err);
        if (attempt < 5) {
            setTimeout(() => {
                shieldTransaction(amount, shieldedAccountKeypair, recoveryAccount);
            }, 100000);
        }
        if (attempt > 5) {
            setTimeout(() => {
                shieldTransaction(amount - 5000, shieldedAccountKeypair, recoveryAccount);
            }, 100000);
        } else if (attempt > 10) { 
            console.log(err);
            console.log('Could not shield. Maybe high network congestion.');
            twilio.sendNotification('Could not shield transaction. Check your server logs and SOL wallet immediately.');
        } 
    }

}

start();
