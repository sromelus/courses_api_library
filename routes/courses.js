'use strict';

const express = require('express');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const { authenticateUser, courseInputsValidator } = require('../authentications/auth');
const Course = require('../db/models/course');
const User = require('../db/models/user');

const router = express.Router();

/* Handler function to wrap each route. */
function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
        next(error)
    }
  }
}


//----------------------------All Routes------------------------------

//Returns a list of courses (including the user that owns each course)
router.get('/', asyncHandler(async (req, res) => {
  const courses = await Course.find();
  res.status(200).json({ courses: courses });
}));


// Returns a the course (including the user that owns the course) for the provided course ID
router.get('/:id', asyncHandler(async (req, res, next) => {
  const courses = await Course.find().populate({ path: 'userId', select: 'firstName lastName emailAddress' });

  const course = courses.find(course => course.id == req.params.id);

  if(course){
    res.status(200).json({course: course})
  } else {
    next();
  }
}));


//Creates a course, check if current user is logged in and check for correct in puts
router.post('/', authenticateUser, courseInputsValidator, asyncHandler(async (req, res) => {

  const errors = validationResult(req);

  if(!errors.isEmpty()){
    const errorMessages = errors.array().map(error => error.msg);
    res.status(400).json({ message: errorMessages })
  } else {
    const course = new Course({
      title: req.body.title,
      description: req.body.description,
      estimatedTime: req.body.estimatedTime,
      materialsNeeded: req.body.materialsNeeded,
      userId: req.currentUser.id
    });

    await course.save();
    res.location(`/api/courses/${course.id}`);
    res.status(201).end();
  }
}));


//Updates a course
router.put('/:id', authenticateUser, courseInputsValidator, asyncHandler(async(req, res, next) => {
  //Used "express validator's" validationResult method to check for possible errors
  const errors = validationResult(req);

  if(!errors.isEmpty()){
    const errorMessages = errors.array().map(error => error.msg);
    res.status(400).json({ message: errorMessages })
  } else {

 // Retrieve the course and update the specified field, if there is a course with that ID
    const course = await Course.findById(req.params.id);

    if(course){
      if(req.currentUser._id.toString() == course.userId.toString()){
        await course.updateOne({
          title: req.body.title,
          description: req.body.description,
          estimatedTime: req.body.estimatedTime,
          materialsNeeded: req.body.materialsNeeded,
          userId: req.currentUser.id
         });

        res.status(204).end();
      } else {
        res.status(403).json({ message: ['Forbidden']})
      }
    } else {
      next();
    }
  }
}));

// Deletes a course
router.delete('/:id', authenticateUser, asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if(course){
    if(req.currentUser._id.toString() == course.userId.toString()){
      await course.deleteOne();
      res.status(204).end();
    } else {
      res.status(403).json({ message: 'Forbidden'});
    }
  } else {
    next();
  }
}));


module.exports = router;
