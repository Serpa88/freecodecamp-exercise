const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.Promise = global.Promise
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )
const {User, Exercise} = require('./schemas.js')

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', function (req, res, next) {
  if (req.body.username) {
    User.findOne({username: req.body.username}, function (err, user) {
      if (err) next(err)
      else if (user) res.status(400).send('username already taken')
      else {
        const nUser = new User({username: req.body.username})
        nUser
          .save()
          .then(function (savedUser) {
          res.json(savedUser)
        })
          .catch(function (err) {
          next(err)
        })
          }
    })
  } else {
   res.status(400).send('Path `username` is required.')
  }
})

app.post('/api/exercise/add', function (req, res, next) {
  const body = req.body;
  if (body.userId && body.description && body.duration) {
    User.findById(body.userId, function (err, user) {
      if (err) next(err)
      else if (user) {
        let ExerciseObj = {
          userId: body.userId,
          description: body.description,
          duration: body.duration
        }
        if (body.date) ExerciseObj.date = new Date(body.date)
        const nExercise = new Exercise(ExerciseObj)
        nExercise.save(function (err, exercise) {
          if (err) next(err)
          else {
           res.json({
            username: user.username,
            description: exercise.description,
            duration: exercise.duration,
             _id: user._id,
             date: exercise.date
           })
          }
        })
      } else {
       res.status(400).send('unknown _id') 
      }
    })
  }
})

app.get('/api/exercise/log', function (req, res, next) {
  User.findById(req.query.userId, function (err, user) {
    if (err) next (err)
    else if (user) {
      let exerciseSearch = {
        userId: req.query.userId
      }
      if (req.query.from || req.query.to) exerciseSearch.date = {} 
      if (req.query.from) exerciseSearch.date.$gt = new Date(req.query.from)
      if (req.query.to) exerciseSearch.date.$lt = new Date(req.query.to)
      Exercise.find(exerciseSearch, '-_id description duration date', {limit: parseInt(req.query.limit)}, function (err, exercises) {
        if (err) next(err)
        else {
          res.json({
           _id: user._id,
            username: user.username,
            count: exercises.length,
            log: exercises
          })
        }
      })
    } else res.status(400).send('unknown userId')
  })
})

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
