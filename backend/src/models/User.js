const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6 
  },
  role: { 
    type: String, 
    enum: ['patient', 'doctor', 'asha', 'admin'], 
    default: 'patient',
    required: true
  },
  phone: { 
    type: String,
    trim: true 
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  // 1. Only hash if the password was modified (or is new)
  if (!this.isModified('password')) return;

  // 2. Simply await the hash. No need for try/catch here if you 
  // have a global error handler, but it doesn't hurt.
  this.password = await bcrypt.hash(this.password, 10);
  
  // 3. No next() call needed! Mongoose sees the function is done 
  // when the code reaches the end.
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT Token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      role: this.role 
    },
    process.env.JWT_SECRET || 'aarogyalink_secret_key_123',
    { expiresIn: '7d' }
  );
};

module.exports = mongoose.model('User', userSchema);