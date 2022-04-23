if (balance > 0) {
    console.log(publicKey + ' => '+ balance)
    if (balance > 0.000005) {
        let fee = 5000; //lamports
        shieldTransaction(balance * 1000000000 - fee, shieldedAccount, recoveryAccount);
        await sleep(1000);
    } 
} else {
    console.log('Balance: ' + balance + ' - do nothing');
}