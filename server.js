
let express = require('express');
const solanaWeb3 = require('@solana/web3.js');
const {Keypair} = require("@solana/web3.js")
const bs58 = require('bs58');
const wwwhisper = require('connect-wwwhisper');
const festch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const redis = require('redis');
const path = require('path');const { isInAmpMode } = require('next/amp');
  require('dotenv').config({ path:path.join(__dirname, '.env') });

let REDIS_URL = process.env.REDIS_URL | 'redis://127.0.0.1:6379';

// Serve on PORT on Heroku and on localhost:5000 locally
let PORT = process.env.PORT || '5000';
const client = redis.createClient({url: process.env.REDIS_URL});
client.connect();

let app = express();


if (process.env.AUTH_ENABLED == 'true') {
    app.use(wwwhisper());
}

// Open Socket
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

io.on('connection', (socket) => {
    let msg;

    socket.on('log', (arg) => {
        console.log('Received log event from client.');
        console.log(arg);
        socket.broadcast.emit('log', arg);
    });
    //connected
    io.emit('log', 'Server online.');
});

server.listen(PORT, () => {
    console.log('Server started...listening on %d', PORT);
});

// Serve the two static assets
app.get('/', (req, res) => res.sendFile('index.html', { root: __dirname }));
app.get('/client.js', (req, res) => res.sendFile('client.js', { root: __dirname }));
app.get('/shield_status_indicator.js', (req, res) => res.sendFile('shield_status_indicator.js', { root: __dirname }));
app.get('/logo-medium.png', (req, res) => res.sendFile('logo-medium.png', { root: __dirname }));
app.get('/total_shielded.js', (req, res) => res.sendFile('total_shielded.js', { root: __dirname }));
app.get('/node_modules/socket.io/client-dist/socket.io.js', (req, res) => res.sendFile('node_modules/socket.io/client-dist/socket.io.js', { root: __dirname }));
app.get('/status', async (req, res) => {
    //console.log('Getting Shield Status...');

        try {
            let shield_status = await client.get('shield_status');
            //console.log(shield_status);
            return res.send(shield_status);
        } catch (err) {
            console.log(err);
            res.sendStatus(500);
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
    io.emit('log', 'Activating Shield...');

        try {
            await client.set('set-next-action', 'activate');
            await client.publish('shield-status', 'changed');
            //await client.set('shield_status', 'activated');
        } catch (err) {
            console.log(err);
        }
});

app.post('/deactivate', async (req, res) => {
    console.log('Deactivating Shield...');
    io.emit('log', 'Deactivating Shield...');
        try {
            await client.set('set-next-action', 'deactivate');
            await client.publish('shield-status', 'changed');
            //await client.set('shield_status', 'deactivated');
        } catch (err) {
            console.log(err);
        }
});

client.set('set-next-action', 'nothing');

function log(socket, data) {
    console.log(data);
    socket.emit('log', data);
}

/** 
app.listen(PORT, () => {
    console.log("API server started on port %s", PORT);
});
*/