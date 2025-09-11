import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
const options = {}

let client;
let clientPromise;

if(!process.env.MONGODB_URI){
    throw new Error("Please add mongo db to your env file")
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to maintain the MongoDB client
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
}
else {
  // In production mode, create a new MongoDB client for each request
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Add this connectDB function for Mongoose
let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('MongoDB connected via Mongoose');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export default clientPromise;