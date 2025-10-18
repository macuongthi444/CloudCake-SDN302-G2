// Create a new file: back_end/src/utils/mongodb.js
const mongoose = require('mongoose');

let cachedConnection = null;

const connectToDatabase = async () => {
    if (cachedConnection) {
        return cachedConnection;
    }

    try {
        const connection = await mongoose.connect(process.env.MONGO_URI, {
            dbName: process.env.DB_NAME,
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10
        });

        console.log('MongoDB connected successfully');
        cachedConnection = connection;
        return connection;
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        throw error;
    }
};

module.exports = connectToDatabase;