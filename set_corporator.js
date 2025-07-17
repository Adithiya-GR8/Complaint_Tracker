// set_corporator.js
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const saltRounds = 10;

// Terminal input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

// Load SQL from file
function loadQuery(name) {
    return fs.readFileSync(path.join(__dirname, 'queries', `${name}.sql`), 'utf8');
}

(async () => {
    try {
        const full_name = await ask('Enter full name: ');
        const email = await ask('Enter email: ');
        const password = await ask('Enter password: ');
        const area_id = await ask('Enter area_id: ');

        rl.close();

        const hash = await bcrypt.hash(password, saltRounds);

        const connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // update if needed
            database: 'complaint_system' // update this to your DB name
        });

        const sql = loadQuery('set_corporator');
        connection.query(sql, [area_id, full_name, email, hash], (err, results) => {
            if (err) throw err;
            console.log('Corporator added/updated successfully for:', email);
            connection.end();
        });
    } catch (err) {
        console.error('Error:', err.message);
        rl.close();
    }
})();
