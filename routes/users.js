'use strict';

const express = require('express');
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const { validationResult } = require('express-validator');
const { authenticateUser, userInputsValidator } = require('../authentications/auth');
const Course = require('../db/models/course');
const User = require('../db/models/user');
const router = express.Router();

/* Handler function to wrap each route. */
function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
        next(error);
    }
  }
}

//----------------------------All Routes------------------------------

router.get("/", authenticateUser, asyncHandler(async (req, res) => {

    const users = await User.find();

    const user = req.currentUser;

    const { firstName, lastName } = user;
    res.status(200).json({
        name: { firstName, lastName },
        email: `${user.emailAddress}`
    });
}));


router.post("/", userInputsValidator, asyncHandler(async(req, res) => {

  //Used "express validator's" validationResult method to check for possible errors
  const errors = validationResult(req);

  if(!errors.isEmpty()){
    const errorMessages = errors.array().map(error => error.msg);
    res.status(400).json({ errors: errorMessages })
  } else {
    const user = req.body;
    //Use bcrypt to hash user password when they sign up
    user.password = bcryptjs.hashSync(user.password);

      const newUser = new User({
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress,
        password: user.password
      });

   await newUser.save();
   res.status(201).location("/").end();
  }
}));

module.exports = router;
