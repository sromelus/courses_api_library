'use strict';

const { check, validationResult } = require('express-validator');
const User = require('../db/models/user');
const auth = require('basic-auth');
const bcryptjs = require('bcryptjs');

/**
 * Middleware to authenticate the request using Basic Authentication.
 * @param {Request} req - The Express Request object.
 * @param {Response} res - The Express Response object.
 * @param {Function} next - The function to call to pass execution to the next middleware.
 */

const authenticateUser = async(req, res, next) => {

  let message = null;
  let isCredentialsNotEmpty = null;

  //Parse the user's credentials from the Authorization header.
  const credentials = auth(req);

  if(credentials){
    
    const users = await User.find();

    const user = users.find(user => user.emailAddress === credentials.name);

    if(user){
      // Check if the propective user's password match the user password in the database
      const authenticated = bcryptjs.compareSync(credentials.pass, user.password);

      if (authenticated) {
        console.log(`Authentication succefull for user with email: ${credentials.name}`);
        req.currentUser = user;
      } else {
        message = `Authentication failure for user with email: ${credentials.name}`;
      }
    } else {
       message = `User not found for username: ${credentials.name}`;
    }

  } else {
    message = 'Auth header not found';
  }

  if(message){
    console.warn(message);
    res.status(401).json({ message: ['Access Denied']})
  } else {
    next();
  }
};

const courseInputsValidator = [
  //Used "express validator's" check method to validate inputs
  check("title", 'Please provide a "title"').exists({checkNull: true, checkFalsy: true }),
  check("description", 'Please provide a "description"').exists({checkNull: true, checkFalsy: true })
]


const userInputsValidator = [
  //Used "express validator's" check method to validate inputs
    check('firstName', 'Please provide a value for "First Name"').exists({ checkNull: true, checkFalsy: true }),
    check('lastName', 'Please provide a value for "Last Name"').exists({ checkNull: true, checkFalsy: true }),
    check('emailAddress', 'Please provide a value for "Email Address"').isEmail(),
    check('email').custom(async(value, { req }) => {
      const users = await User.find();
      const user = users.find(user => user.emailAddress === req.body.emailAddress);
      if (user) {
        throw new Error('Email account already exist');
      }
    })
    ,
    check('password', 'Please provide a value for "Password"').exists({ checkNull: true, checkFalsy: true }),
    check('password', 'Min 6 chars length for "Password"').isLength({ min: 6 })
]



const authentication = {
  authenticateUser,
  courseInputsValidator,
  userInputsValidator
}

module.exports = authentication;
