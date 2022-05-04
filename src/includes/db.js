const { Pool } = require('pg');
const { connectionString } = require('pg/lib/defaults');
const { AddOnResultInstance } = require('twilio/lib/rest/api/v2010/account/recording/addOnResult');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres@localhost/shield_development',
    ssl: false
});

const createSubscriber = require('pg-listen');

const subscriber = createSubscriber({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres@localhost/shield_development',
});

subscriber.connect();





async function getShieldStatusDB () {
    const getShieldStatusQuery = 'SELECT * FROM shield WHERE id = $1';
    const values = [1];

    return await pool.query(getShieldStatusQuery, values).then((res, err) => {
        if (err) {
            console.log('Could not get Shield Status from DB.');
            console.log(err);
            return 'error';
        } else {
            let status = res.rows[0].status;
            return status;
        }
    });

}

async function updateShieldStatusDB (status) {
    console.log('Updating Shield Status in DB to: ', status);

    const currentStatus = await getShieldStatusDB();

    if (typeof status !== 'boolean' && status == currentStatus) {
        console.log('Status not true or false. OR its already set');
        return;
    } else {
        const setShieldStatusQuery = 'UPDATE shield SET status = $2 WHERE id = $1';
        const values = [1, status];
        pool.query(setShieldStatusQuery, values).then((result, err) => {
            if (err) {
                console.log('Could not update Shield Status DB.');
                console.log(err.stack);
            } else {
                console.log('Shield Status DB Updated to: ', status);
                subscriber.notify('shield_update', status);
                return true;
            }
        });  
    }  
}

async function checkDBStatus () {
    const checkTableQuery = 'SELECT EXISTS (SELECT FROM shield)';

    return await pool.query(checkTableQuery)
        .then(res => {
            return true;
        })
        .catch(err => {
            return false;
        });
}

async function initDB () {

    let dbInitialized = await checkDBStatus();
    
    if (dbInitialized == true) {
        console.log('Shield DB is already initialized.');
        return true;
    } else {
        const createTableQuery = 'CREATE TABLE IF NOT EXISTS shield (id serial PRIMARY KEY, status boolean NOT NULL)';
        return await pool.query(createTableQuery)
            .then(res => {
                console.log('Table initialized.');
    
                const insertTableQuery = 'INSERT INTO shield (id, status) VALUES(1, $1) ON CONFLICT DO NOTHING RETURNING *';
                const values = [false];
    
                pool.query(insertTableQuery, values)
                    .then(res => {
                        if (res.rowCount > 0) {
                            console.log('Shield Status DB set to start at false.');
                        } else {
                            console.log('Shield Status DB did not need to be set.');
                        }
                    })
                    .catch(err => {
                        console.log('Error initializing shield status DB.');
                        console.log(err.stack);
                    });

                return true;
            })
            .catch(err => {
                console.log('Error creating shield DB.');
                console.log(err.stack)
                return false;
            });
    }
}

module.exports = {initDB, getShieldStatusDB, updateShieldStatusDB};

