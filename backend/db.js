const mongoose = require('mongoose');
require('dotenv').config();

const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/akshuutransports';
const LOCAL_MONGO_URI = process.env.LOCAL_MONGO_URI || DEFAULT_MONGO_URI;
const PRIMARY_MONGO_URI = process.env.MONGO_URI || LOCAL_MONGO_URI;
const shouldAllowLocalFallback =
  process.env.ALLOW_LOCAL_MONGO_FALLBACK !== 'false' &&
  PRIMARY_MONGO_URI !== LOCAL_MONGO_URI;

const maskMongoUri = (uri) => String(uri || '').replace(/:([^:@/]+)@/, ':****@');

const connectWithUri = async (mongoUri, label) => {
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000
  });
  console.log(`MongoDB Connected Successfully (${label}: ${maskMongoUri(mongoUri)})`);
};

const connectDB = async () => {
  try {
    await connectWithUri(PRIMARY_MONGO_URI, 'primary');
  } catch (primaryError) {
    if (shouldAllowLocalFallback) {
      console.warn(`Primary MongoDB connection failed: ${primaryError.message}`);
      console.warn(`Attempting local fallback at ${maskMongoUri(LOCAL_MONGO_URI)}...`);

      try {
        await connectWithUri(LOCAL_MONGO_URI, 'local fallback');
        return;
      } catch (fallbackError) {
        console.error('MongoDB local fallback failed:', fallbackError.message);
      }
    }

    console.error('MongoDB Connection Failed.');
    console.error(`Primary URI: ${maskMongoUri(PRIMARY_MONGO_URI)}`);
    if (shouldAllowLocalFallback) {
      console.error(`Local fallback URI: ${maskMongoUri(LOCAL_MONGO_URI)}`);
    }
    console.error(`Reason: ${primaryError.message}`);
    console.error('If you use MongoDB Atlas, verify your current IP is allowed in Atlas Network Access.');
    console.error('For local development, start MongoDB locally and set LOCAL_MONGO_URI if needed.');
    process.exit(1);
  }
};

module.exports = connectDB;
