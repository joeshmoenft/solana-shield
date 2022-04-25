//Twilio Setup
var twilioSid = process.env.TWILIO_ACCOUNT_SID;
var twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
var twilioToNumber = process.env.TWILIO_TO_NUMBER;
var twilioFromNumber = process.env.TWILIO_FROM_NUMBER;
var smsIsActivated = process.env.SMS_NOTIFICATIONS || false;

const twilio = require('twilio')(twilioSid, twilioAuthToken, {});

async function sendSMS(text) {
    console.log('SMS Notifications Activated: ' + smsIsActivated);
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
}

module.exports = { sendSMS };