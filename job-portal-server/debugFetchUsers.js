require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vgn0xjv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('mernJobPortal');
    const users = await db.collection('users').find({}).sort({ createdAt: -1 }).limit(10).toArray();
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error querying MongoDB:', err.message);
  } finally {
    await client.close();
  }
})();
