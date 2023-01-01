const mongoose = require('mongoose');
require('dotenv').config();

mongoose.set('strictQuery', false);

class Database {
    constructor() {
        this.connection = null;
    }

    connect() {
        console.log('Connecting to database...');

        mongoose.connect(process.env.MONGO_URL).then(() => {
            console.log('Connected to database');
            this.connection = mongoose.connection;
        }).catch(err => {
            console.log("Failed to connect to database.")
            console.error(err)
        });
    }
}

module.exports = Database;