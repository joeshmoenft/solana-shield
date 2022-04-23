# Solana Shield

![](https://github.com/joeshmoenft/solana-shield/blob/main/logo-medium.png)

> Protect your SOL address by auto-transferring any Solana that enters your wallet.

** USE AT YOUR OWN RISK. THIS IS AN 'ALPHA' TECHNOLOGY AND IS YET TO BE AUDITED. **

Hi there, welcome to Solana Shield. Solana Shield is an application that automatically 
transfers out any Solana in your wallet to a Recovery Address of your choice. Essentially, this acts as a 2-factor-authentication lock for a Solana wallet of your choice.

Use Cases:
* Auto-transfer SOL from a compromised or old secondary sales treasury wallet to a new one
* Auto-transfer SOL from sold NFTs in your hot wallet to keep your SOL safe and deter hackers
* Keep your hot wallet uninteresting for hackers to target (because there'd be no SOL in there)
* Protect your staking assets by disallowing any SOL to enter your wallet, thus disabling the ability for a hacker to unstake and move the NFT
* Get a chance of recovering assets from a compromised wallet

Security Considerations:
* You are storing your private key in an encrypted variable online. With heroku, this is known to be a very secure way to store these online. Many big applications use this for storing secret API keys and hasn't been hacked as far as we know. One way for the hacker to get your private key through this would be to 1) know you're using Solana Shield, and 2) get access to your e-mail, and 3) get access to your heroku login 2FA code (that you should setup on your account). This is a big deterrant, especially since it's a lot of effort to hack for a  wallet that has 0 SOL in it (which it would if you're running the shield).

This is not intended for cold wallets and you're 'safe' wallet. It's meant for the ones you're connecting to other sites and logging into Phantom apps with. Please get a Ledger and store your assets there, with seed keys stored offline.




Here's how it works:

You setup your own Solana Shield on a hosting server of your choice. We have provided an easy deployment method through Heroku that you can use below that automagically spins everything up for you (using the button below), or you can download the source and deploy via your own method. Note: we haven't tested any other deployment methods so you may need some code-fu to get it working on another platform.

Once you launch your server, you will need to configure the environment variables in Settings:

SHIELDED_ACCOUNT_PRIVATE_KEY: Your private key to the account you want SOL to come out of. You can export this from Phantom in settings.

RECOVERY_ACCOUNT_ADDRESS :  The public address of the account you want the SOL sent to.

NETWORK: Either mainnet-beta for the Mainnet server or devnet if you'd like to test it on there.

AUTH_ENABLED: Recommended you set this to 'true' so that someone can't enable/disable your shield with your app URL from heroku.

There are other variables as well for job cacheing, background services, etc that help the program run.

s
Requirements:
* Private Key for the Solana account to Shield.
* Public Address for the Solana account you wish to send funds to (your Recovery Address)
* $14/month to pay for a Heroku server to host the application (Free server untested)

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/joeshmoenft/solana-shield/tree/main)

Here's how it works:
1. Deploy the application to Heroku. 
2. Set your config vars in Settings > Config Vars.
3. Make sure both 'web' and 'worker' Dynos are on, or restarted after you set the Config Vars.
4. Open the app, use the auth system to login. Your username is the account e-mail you set up for Heroku.
5. Turn the Shield on or off :)
