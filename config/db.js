const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wanzofc_api';

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ MongoDB terhubung');
  } catch (error) {
    console.error('❌ Gagal terhubung ke MongoDB:', error.message);
    process.exit(1); 
  }
};

module.exports = connectDB;