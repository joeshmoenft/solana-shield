const { Pool } = require('pg');
const { connectionString } = require('pg/lib/defaults');
const { AddOnResultInstance } = require('twilio/lib/rest/api/v2010/account/recording/addOnResult');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres@localhost/shield_development',
    ssl: false
});

async function getShieldStatusDB () {
    console.log('Trying to get shield status');
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

    const currrentShieldStatus = await getShieldStatusDB();

    console.log('Current Shield Status: ', currrentShieldStatus);

    if (!currrentShieldStatus) {
        console.log('Shield Status not set in DB, need to init DB');
        initDB();
    } else {
        return;s
    }

    console.log('Current Shield Status')
    if (typeof status !== 'boolean') {
        console.log('Status not true or false. Could not update status.');
        return;
    } else {
        const setShieldStatusQuery = 'UPDATE shield SET status = $2 WHERE id = $1';
        const values = [1, status];
        pool.query(setShieldStatusQuery, values, function(err, result) {
            if (err) {
                console.log('Could not update Shield Status DB.');
                console.log(err.stack);
            } else {
                console.log('Shield Status DB Updated to: ', status);
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

