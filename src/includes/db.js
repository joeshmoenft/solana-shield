const { Pool } = require('pg');
const { connectionString } = require('pg/lib/defaults');
const { AddOnResultInstance } = require('twilio/lib/rest/api/v2010/account/recording/addOnResult');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres@localhost/shield_development',
    ssl: false
});

initDB();
getShieldStatusDB();

function getShieldStatusDB () {
    const getShieldStatusQuery = 'SELECT * FROM shield WHERE id = $1';
    const values = [1];

    pool.query(getShieldStatusQuery, values, function(err, result) {
        if (err) {
            console.log('Could not get Shield Status from DB.');
            console.log(err);
        } else {
            let status = result.rows[0].status;
            return status;
        }
    });
}

function initDB () {
    const createTableQuery = 'CREATE TABLE IF NOT EXISTS shield (id serial PRIMARY KEY, status boolean NOT NULL)';
    pool.query(createTableQuery, (err, res) => {
        if (err) {
            console.log('Error creating shield DB.');
            console.log(err.stack)
        } else {
            console.log('Table initialized.');
            const insertTableQuery = 'INSERT INTO shield (id, status) VALUES(1, $1) ON CONFLICT DO NOTHING RETURNING *';
            const values = [false];
    
            pool.query(insertTableQuery, values, function(err, result) {
                if (err) {
                    console.log('Error initializing shield status DB.');
                    console.log(err.stack);
                } else {
                    if (result.rowCount > 0) {
                        console.log('Shield Status DB set to start at false.');
                    } else {
                        console.log('Shield Status DB did not need to be set.');
                    }
                }
            });
        }
    });
}

