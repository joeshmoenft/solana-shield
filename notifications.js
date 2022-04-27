//Twilio Setup
var twilio;
var twilioSid = process.env.TWILIO_ACCOUNT_SID;
var twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
var twilioToNumber = process.env.TWILIO_TO_NUMBER;
var twilioFromNumber = process.env.TWILIO_FROM_NUMBER;
var smsIsActivated = process.env.SMS_NOTIFICATIONS || false;

var Pushover;
var push;
var pushoverIsActivated = process.env.PUSH_NOTIFICATIONS || false;
var pushToken = process.env.PUSHOVER_TOKEN;
var pushUser = process.env.PUSHOVER_USERKEY;

if (smsIsActivated == "true") {
    twilio = require('twilio')(twilioSid, twilioAuthToken, {});
}

if (pushoverIsActivated == "true" && pushToken && pushUser) {
    Pushover = require('node-pushover');

    push = new Pushover({
        token: pushToken,
        user: pushUser
    });
} else {
    console.log('Push notifications could not be activated. Make sure your Environment variables are set.');
}



console.log('SMS Notifications: ' + smsIsActivated);
console.log('Push Notifications: ' + pushoverIsActivated);

async function sendNotification(text) {
    
    if (smsIsActivated == "true") {
        try {
            twilio.messages
            .create({body: text, from: twilioFromNumber, to: twilioToNumber})
            .then(message => console.log('SMS Sent: ' + text));
        } catch (err) {
            console.log('Could not send SMS: ' + text);
            console.log(err);
        }
    } 

    if (pushoverIsActivated == "true") {
        try {
            push.send("Solana Shield", text, function (err, res){
                if(err) {
                    console.log('Could not send push notification: ' + text);
                    return console.log(err);
                } 
                console.log('Push Notification sent: ' + text);
            });
        } catch (err) {
            console.log('Could not send push notification: ' + text);
            console.log(err);
        }
    }
}

module.exports = { sendNotification };