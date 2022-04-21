
let express = require('express');
let Queue = require('bull');

const solanaWeb3 = require('@solana/web3.js');
const {Keypair} = require("@solana/web3.js")
const csv = require('csv-parser');
const fs = require('fs');
const bs58 = require('bs58');
const wwwhisper = require('connect-wwwhisper');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

 //devnet or mainnet-beta

if (!process.env.SHIELDED_ACCOUNT_PRIVATE_KEY && !process.env.RECOVERY_ACCOUNT_ADDRESS) {
    console.log('Please set your ENV variables.');
    return;
}

if (!process.env.NETWORK) {
    console.log('Please select a network in your ENV variables.'); //needs mainnet-beta or devnet
}

const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl(process.env.NETWORK), 'confirmed');

let shieldedSecret = bs58.decode(process.env.SHIELDED_ACCOUNT_PRIVATE_KEY);
let recoveryAccount = process.env.RECOVERY_ACCOUNT_ADDRESS;

let shieldedAccount = Keypair.fromSecretKey(shieldedSecret);

const walletAddress = shieldedAccount.publicKey.toString();

console.log('Initializing shield...');
console.log('Protecting account: %s', shieldedAccount.publicKey);
console.log('Recovery account: %s', recoveryAccount);

// Serve on PORT on Heroku and on localhost:5000 locally
let PORT = process.env.PORT || '5000';
// Connect to a local redis intance locally, and the Heroku-provided URL in production
let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let app = express();

if (process.env.AUTH_ENABLED) {
    app.use(wwwhisper());
}
// Create / Connect to a named work queue
let workQueue = new Queue('work', REDIS_URL);

// Serve the two static assets
app.get('/', (req, res) => res.sendFile('index.html', { root: __dirname }));
app.get('/client.js', (req, res) => res.sendFile('client.js', { root: __dirname }));

// Kick off a new job by adding it to the work queue
app.post('/job', async (req, res) => {
    console.log('Starting job...');

        try {
            let job = await workQueue.add({}, {repeat: { every: 5000 }
            });
        } catch (err) {
            console.log(err);
        }
});

app.post('/job/stop', async() => {
    console.log('Stopping Solana Shield...');
    workQueue.empty().then(function () {
        console.log('Stopped.');
    });
});
// Allows the client to query the state of a background job
app.get('/job/:id', async (req, res) => {
    
  let id = req.params.id;
  let job = await workQueue.getJob(id);

  if (job === null) {
    res.status(404).end();
  } else {
    let state = await job.getState();
    let progress = job._progress;
    let reason = job.failedReason;
    res.json({ id, state, progress, reason });
  }
});

workQueue.on('global:completed', async (jobId, result) => {
  console.log('Check complete.');
});


//empty the queue on launch
try {
    let empty = workQueue.empty();
} catch (err) {
    console.log(err);
}



app.listen(PORT, () => console.log("Server started. Watching..."));