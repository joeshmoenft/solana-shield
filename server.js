
let express = require('express');
const solanaWeb3 = require('@solana/web3.js');
const {Keypair} = require("@solana/web3.js")
const bs58 = require('bs58');
const wwwhisper = require('connect-wwwhisper');
const festch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const redis = require('redis');
const path = require('path');const { isInAmpMode } = require('next/amp');
  require('dotenv').config({ path:path.join(__dirname, '.env') });

const twilio = require('./twilio')

let REDIS_URL = process.env.REDIS_URL | 'redis://127.0.0.1:6379';

// Serve on PORT on Heroku and on localhost:5000 locally
let PORT = process.env.PORT || '5000';
const client = redis.createClient({url: process.env.REDIS_URL});
const sub = client.duplicate();

client.connect();


let app = express();

const server = require('http').createServer(app);
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server:server });

wss.on('connection', function connection(ws) {
    console.log('web: a new client connected');
    ws.send('log', 'test log');
    ws.on('log', function incoming(message) {
        console.log('web: received: %s', message);
        ws.send('from web: got your message dawg: ' + message);
    });
});



if (process.env.AUTH_ENABLED == 'true') {
    app.use(wwwhisper());
}

client.set('server-port', PORT);
// Serve the two static assets
app.get('/', (req, res) => res.sendFile('index.html', { root: __dirname }));
app.get('/client.js', (req, res) => res.sendFile('client.js', { root: __dirname }));
app.get('/shield_status_indicator.js', (req, res) => res.sendFile('shield_status_indicator.js', { root: __dirname }));
app.get('/logo-medium.png', (req, res) => res.sendFile('logo-medium.png', { root: __dirname }));
app.get('/status', async (req, res) => {
    //console.log('Getting Shield Status...');
        try {
            let shield_status = await client.get('shield_status');
            //console.log(shield_status);
            return res.send(shield_status);
        } catch (err) {
            console.log(err);
        }
});

app.get('/total', async (req, res) => {

        try {
            let totalShielded = await client.get('totalShielded');
            return res.send(totalShielded);
        } catch (err) {
            console.log(err);
            res.sendStatus(500);
        }
});

app.post('/activate', async (req, res) => {
    console.log('Activating Shield...');
    log('log', 'Activating Shield...');

        try {
             await client.set('set-next-action', 'activate');
             await client.publish('shield-status', 'changed');
             res.sendStatus(200);
            //await client.set('shield_status', 'activated');
        } catch (err) {
            console.log(err);
            res.sendStatus(500);
        }
});

app.post('/deactivate', async (req, res) => {
    console.log('Deactivating Shield...');
    log('log', 'Deactivating Shield...');
        try {
            await client.set('set-next-action', 'deactivate');
            await client.publish('shield-status', 'changed');
            //await client.set('shield_status', 'deactivated');
            res.sendStatus(200);
        } catch (err) {
            console.log(err);
            res.sendStatus(500);
        }
});

client.set('set-next-action', 'nothing');

function log(socket, data) {
    console.log(data);
   // socket.emit('log', data);
}

twilio.sendSMS('Solana Shield Web Server started. If you arent just setting this up, look into it.');

server.listen(PORT, () => {
    console.log('Server started...listening on %d', PORT);
});


