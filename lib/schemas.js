const mongoose = require('mongoose')
const Schema = mongoose.Schema
const transform = require('./transform')

const EventsSchema = new Schema({
  _id: String,
  type: { type: String, required: true },
  user: { type: String, required: true },
  merchant: { type: String, required: true },
  time: { type: Date, required: true },
  // TODO: data should be expanded to represented the actual data structure
  data: { type: Object, required: true }
})

const EventModel = mongoose.model('Events', EventsSchema)

const Events = {
  // TODO: improve error handling here, in general, and more specifically so that validation failures are more clear to client.
  insertAll: async (events) => {
    try {
      const transformedEvents = await transform.extendProducts(events)
      const docs = await new Promise((resolve, reject) => {
        EventModel.insertMany(transformedEvents, (err, docs) => {
          if (err) {
            reject(err)
          } else {
            resolve(docs)
          }
        })
      })
      return docs
    } catch (e) {
      console.log(e)
    }
  },
  find: (query) => {
    return new Promise((resolve, reject) => {
      EventModel.find(query, (err, assignments) => {
        if (err) {
          reject(err)
        } else {
          resolve(assignments)
        }
      })
    })
  },
  deleteAll: () => {
    return new Promise((resolve, reject) => {
      EventModel.deleteMany({}, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}

module.exports = {
  Events
}
