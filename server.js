let express = require('express');
const wwwhisper = require('connect-wwwhisper');
const redis = require('redis');
const path = require('path');
const twilio = require('./src/includes/notifications');
require('dotenv').config({path: path.join(__dirname, '.env')});

let app = express();


let PORT = process.env.PORT || '5000';
let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
if (process.env.AUTH_ENABLED == 'true') {
    app.use(wwwhisper());
}


const client = redis.createClient({url: REDIS_URL});
client.connect();
client.set('server-port', PORT);
client.on('error', (err) => {
    console.log('REDIS client could not connect');
    console.log(err);
});
client.on('connect', () => {
    console.log('Redis client connected.');
});


app.get('/', (_, res) => res.sendFile('index.html', {root: path.join(__dirname, './src')}));
app.get('/shield_status_indicator.js', (_, res) => res.sendFile('/shield_status_indicator.js', {root: path.join(__dirname, './src/includes')}));
app.get('/src/img/logo-medium.png', (_, res) => res.sendFile('logo-medium.png', {root: path.join(__dirname, './src/img')}));
app.get('/status', async (_, res) => {
    try {
        let shield_status = await client.get('shield_status');
        return res.send(shield_status);
    } catch (err) {
        console.log(err);
    }
});

app.get('/total', async (_, res) => {
    try {
        let totalShielded = await client.get('totalShielded');
        return res.send(totalShielded);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.post('/activate', async (_, res) => {
    console.log('Activating Shield...');

    try {
        await client.set('set-next-action', 'activate');
        await client.publish('shield-status', 'changed');
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.post('/deactivate', async (_, res) => {
    console.log('Deactivating Shield...');
    try {
        await client.set('set-next-action', 'deactivate');
        await client.publish('shield-status', 'changed');
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

client.set('set-next-action', 'nothing');

twilio.sendNotification('Solana Shield Web Server started. If you arent just setting this up, look into it.');

app.listen(PORT, () => {
    console.log('Server started...listening on %d', PORT);
});


