# Solana Shield

developed by [@rhh4x0r](https://twitter.com/rhh4x0r) for [@JoeShmoeNFT](https://twitter.com/joeshmoenft)

![](https://github.com/joeshmoenft/solana-shield/blob/main/logo-medium.png)

[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/solanashield)
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/joeshmoenft)

---

> Protect your SOL address by auto-transferring any Solana that enters your wallet.

** USE AT YOUR OWN RISK. THIS IS AN 'ALPHA' TECHNOLOGY AND MAY BE PRONE TO ERRORS, CRASHES, and SECURITY RISKS. **

> If you are a security auditor and find bugs or vulnerabilties, please message RHH on Twitter at @rhh4x0r or submit a Github issue.

Hi there, welcome to Solana Shield. Solana Shield is an application that automatically 
transfers out any Solana in your wallet to a Recovery Address of your choice. Essentially, this acts as a 2-factor-authentication lock for a Solana wallet of your choice.

---
## Use Cases:
* Auto-transfer SOL from a compromised or old secondary sales treasury wallet to a new, safer cold wallet
* Auto-transfer SOL from sold NFTs in your hot wallet to keep your SOL safe and deter hackers from being interested in your account
* Keep your hot wallet uninteresting for hackers to target (because there'd be no SOL in there)
* Protect your staking assets by disallowing any SOL to enter your wallet, thus disabling the ability for a hacker to unstake and move any NFTs
* Get a chance of recovering assets from a compromised wallet that still has assets in it (like royalties or NFTs)

Security Considerations:
* You are storing your private key in an encrypted variable online. With Heroku, this is known to be a very secure way to store these online. Many big applications use this for storing secret API keys and hasn't been hacked as far as we know. 

* One way for the hacker to get your private key through this, though, would be to 1) know you're using Solana Shield,  2) get access to your e-mail, and 3) get access to your heroku login 2FA code (that you should setup on your account). This is a big deterrant, especially since it's a lot of effort to hack for a  wallet that has 0 SOL in it (which it would if you're running the shield).

* This is not intended for cold wallets and your 'safe' wallet. It's meant for the ones you're connecting to other sites and logging into Phantom apps with. Please get a Ledger and store your assets there, with seed keys stored offline.

---
## Here's how it works:

You setup your own Solana Shield on a hosting server of your choice. We have provided an easy deployment method through Heroku that you can use below that automagically spins everything up for you (using the button below), or you can download the source and deploy via your own method. 

> If you choose to do so, you acknowledge that it is untested and probably will require source code modifications to make it work.

Once you launch your server, you will need to configure the environment variables in Settings:

`SHIELDED_ACCOUNT_PRIVATE_KEY`: Your private key to the account you want SOL to come out of. You can export this from Phantom in settings. Since we aren't running off a smart contract, the program needs this to detect and send SOL.

`RECOVERY_ACCOUNT_ADDRESS` : The public address of the account you want the SOL sent to. You can copy this from Phantom as if you were to send this address to a friend.

`NETWORK`: Either `mainnet-beta` for the Mainnet server or `devnet` if you'd like to test it on there.

`AUTH_ENABLED`: **HIGHLY Recommended** you set this to `true` so that someone can't enable/disable your shield with your app URL from Heroku. If you don't do this your Shield will be vulnerable. Only use for testing.

---
## Requirements
* Private Key for the Solana account to Shield.
* Public Address for the Solana account you wish to send funds to (your Recovery Address)
* $14/month to pay for a Heroku server to host the application (Free server untested)

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/joeshmoenft/solana-shield/tree/main)
---
## Setup Instructions
1. Setup a Heroku account at https://www.Heroku.com
2. Put in Billing Information to verify your account. This is a necessity as the program requires a server load beyond the Free Plan. If you do not do this your setup will fail. The cost is between $0-14/month.
3. Deploy the application to Heroku using the button in this document. 
2. Set your config vars in `Settings > Config Vars`.
3. Make sure both `web` and `worker` Dynos are on, or restarted after you set the Config Vars.
4. Open the app, use the auth system to login. Your username is the account e-mail you set up for Heroku. It will send an e-mail with a magic link to access your Shield UI.
5. Turn the Shield on or off by clicking `Activate` or `Deactivate`
6. If you have notifications enabled, you will receive SMS/Push Notifications when the Shield is Activated, Deactivated, or SOL is Shielded. See below for enabling them.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/joeshmoenft/solana-shield/tree/main)
---
## Pushover Notifications

Solana Shield has an integrated ability to send Push Notifications to your phone for key tasks: when the server starts, when your shield is Activated/Deactivated, when SOL was shielded in your wallet, etc.

We integrate with the app 'Pushover', which is a iOS/Android app you can download and setup your own account to. 

To set this up, visit https://pushover.net/, setup an account and download the app. Then, in your Config Vars on Heroku, set the following variables: 

`PUSH_NOTIFICATIONS`=`true`
`PUSHOVER_TOKEN`=`apcs6pf8eovg7288frgs4dkeuz2wt4`
`PUSHOVER_USERKEY`=`(your User Key here)`

PUSHOVER_TOKEN is a public server that we setup to make this process easier, however ease of mind, you are more than welcome to setup your own application and change `PUSHOVER_TOKEN` with your application secret.

---
## Twilio Notifications

If you'd also like to receive SMS messages instead of Push Notifications, you may integrate your Twilio account by using the following variables:

`TWILIO_ACCOUNT_SID`=
`TWILIO_AUTH_TOKEN`=
`TWILIO_TO_NUMBER`=
`TWILIO_FROM_NUMBER`=
`SMS_NOTIFICATIONS`=true


Note that this requires that you have Twilio credits to setup, which may cost money unless they give you some with a free trial. All of these variables can be found in your Twilio console.

---
## Papertrails Alerts

Papertrail is a logging software that's automatically attached to Solana Shield that allows you to view logs of the server and send notifications when your server goes down.

This is important because you want to know if Solana Shield crashes as it leaves your account vulnerable (aka, turned off).

You can set alerts to e-mail or Pushover.

To setup alerts, visit your Papertrail account and setup the following alerts to your E-mail or Pushover account:

```
Name: App Crash
Query: H10
```

```
Name: Dyno Down
Query: up to down
```

See this how-to for more info: https://www.papertrail.com/help/alerts/

## Questions / Support

Solana Shield is provided as-is to the community. If you would like support / help setting this up, buy yourself Joe NFT on Magic Eden [here](https://magiceden.io/marketplace/joe_shmoes_notsoaverage_club) and join our [verified-only Discord channels](https://discord.gg/joeshmoenft).

For all other inquiries (partnerships, etc) please DM [@0x_fxnction](https://twitter.com/0x_fxnction) on Twitter.
