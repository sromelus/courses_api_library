'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  emailAddress: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

module.exports = mongoose.model('User', userSchema);
