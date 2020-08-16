const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const schemas = require('../lib/schemas')
const transform = require('../lib/transform')
const conf = require('../config')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.text())
app.use(express.static('public'))

const mongoDB = conf.mongo
mongoose.connect(mongoDB, { useNewUrlParser: true })
mongoose.Promise = global.Promise
const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

app.get('/test', (req, res) => {
  res.sendStatus(200)
})

app.post('/events', async (req, res) => {
  try {
    const events = req.body
    const eventIds = await schemas.Events.insertAll(events)
    res.status(201)
    res.send({ eventIds })
  } catch (e) {
    res.status(400)
    res.send(e)
  }
})

app.get('/events/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params
    const events = await schemas.Events.find({ merchant: merchantId })
    if (events.length) {
      res.status(200)
      res.send(events)
    } else {
      res.status(404)
      res.send({ error: 'No events exist for this merchant id' })
    }
  } catch (e) {
    res.status(400)
    res.send(e)
  }
})

app.get('/eventSummary/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params
    const events = await schemas.Events.find({ merchant: merchantId })
    if (events.length) {
      const eventSummary = transform.summary(events)
      res.status(200)
      res.send(eventSummary)
    } else {
      res.status(404)
      res.send({ error: 'No events exist for this merchant id' })
    }
  } catch (e) {
    res.status(400)
    res.send(e)
  }
})

module.exports = app
