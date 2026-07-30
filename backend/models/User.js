const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    anonymousHandle: {
      type: String,
      unique: true,
      sparse: true,
    },
    verificationTier: {
      type: Number,
      default: 1, // 1: phone verified, 2: ID verified (future)
    },
    trustScore: {
      type: Number,
      default: 100, // Starting score
    },
    blockedList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
