# Solana Shield

![](https://github.com/joeshmoenft/solana-shield/blob/main/logo-medium.png)

> Protect your SOL address by auto-transferring any Solana that enters your wallet.

Hi there, welcome to Solana Shield. Solana Shield is an application that automatically 
transfers out any Solana in your wallet to a Recovery Address of your choice.

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
