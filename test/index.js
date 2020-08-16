require('mocha')
const request = require('supertest')
const { expect } = require('chai')
const server = require('../server')
const schemas = require('../lib/schemas')
const fetch = require('../lib/fetch')

const events = [
  {
    "type": "product-view",
    "merchant": "iWU4p9dJ9m",
    "user": "017f84ad-337f-4969-a85b-3d8b2de68138",
    "time": "2018-03-23T18:25:43.511Z",
    "data": {
      "product": {
        "sku_code": "220309"
      },
      "location": "https://website.com/product/220309"
    }
  }, 
  {
    "type": "transaction",
    "merchant": "YcxOCwj0jg",
    "user": "44017eb2-fc82-4c8e-87ab-41a4c8a2aa6f",
    "time": "2018-03-23T18:30:43.511Z",
    "data": {
      "transaction": {
        "order_id": "xxxxx1",
        "subtotal": 50,
        "total": 55,
        "line_items": [{
          "product": {
            "sku_code": "887447521318",
            "price": 20
          },
          "quantity": 1,
          "subtotal": 20
        },
        {
          "product": {
            "sku_code": "887447498139",
            "price": 10
          },
          "quantity": 3,
          "subtotal": 30
        }
        ]
      }
    }
  }
]

const eventGroup2 = [
  {
    "type": "product-view",
    "merchant": "YcxOCwj0jg",
    "user": "44017eb2-fc82-4c8e-87ab-41a4c8a2aa6f",
    "time": "2018-03-23T18:25:43.511Z",
    "data": {
      "product": {
        "sku_code": "220309"
      },
      "location": "https://website.com/product/220309"
    }
  }, 
  {
    "type": "transaction",
    "merchant": "YcxOCwj0jg",
    "user": "017f84ad-337f-4969-a85b-3d8b2de68138",
    "time": "2018-03-23T18:30:43.511Z",
    "data": {
      "transaction": {
        "order_id": "xxxxx1",
        "subtotal": 50,
        "total": 55,
        "line_items": [{
          "product": {
            "sku_code": "887447521318",
            "price": 20
          },
          "quantity": 1,
          "subtotal": 20
        },
        {
          "product": {
            "sku_code": "887447498139",
            "price": 10
          },
          "quantity": 3,
          "subtotal": 30
        }
        ]
      }
    }
  }
]

describe('API requests', function () {
  before(async () => {
    await schemas.Events.deleteAll()
  })

  it('/test', () => {
    request(server)
      .get('/test')
      .expect(200)
      .end(function (err, res) {
        expect(err).to.eql(null)
      })
  })

  describe('/events', () => {
    it('succesfully receives an event', (done) => {
      request(server)
      .post('/events')
      .send(events)
        .set('Accept', 'application/json')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(201)
        .end((err, resp) => {
          expect(err).to.eql(null)
          expect(resp.body).to.eql({
            eventIds: resp.body.eventIds
          })
          expect(resp.body.eventIds.length).to.eql(2)
          done()
        })
    })

  })

  describe('/events', () => {
    // The preceding test needs to run succsesfully for this to work
    // TODO: write these tests so they can fail and succeed independently
    const stubbedProductExtension = {
      name: 'Fake product name',
      category: 'Outerwear',
      genderCategory: 'Mens'
    }
    it('responds with events for first merchant Id', (done) => {
      request(server)
        .get(`/events/${events[0].merchant}`)
        .expect(200)
        .end((err, resp) => {
          expect(err).to.eql(null)
          const bodyCopy = [...resp.body]
          const eventsCopy = [...events]
          delete bodyCopy[0].__v
          delete bodyCopy[0]._id
          // extend the product data to include the expected api response
          eventsCopy[0].data.product = {
            ...eventsCopy[0].data.product,
            ...stubbedProductExtension
          }
          expect(bodyCopy).to.eql([eventsCopy[0]])
          done()
        })
    })

    it('responds with events for second merchant Id', (done) => {
      request(server)
        .get(`/events/${events[1].merchant}`)
        .expect(200)
        .end((err, resp) => {
          expect(err).to.eql(null)
          expect(resp.body[0].data.transaction.line_items).to.eql([
          {
            "product": {
              "sku_code": "887447521318",
              "price": 20,
              name: 'Fake product name',
              category: 'Outerwear',
              genderCategory: 'Mens'
            },
            "quantity": 1,
            "subtotal": 20
          },
          {
            "product": {
              "sku_code": "887447498139",
              "price": 10,
              name: 'Fake product name',
              category: 'Outerwear',
              genderCategory: 'Mens'
            },
            "quantity": 3,
            "subtotal": 30
          }

          ])
          done()
        })
    })

    it('responds with 404 when no document is found', (done) => {
      request(server)
        .get(`/getEvents/fakeMerchantId`)
        .expect(404)
        .end((err, resp) => {
          expect(err).to.eql(null)
          done()
        })
    })
  })

  describe('/eventSummary', () => {
    // The preceding test needs to run succsesfully for this to work
    // TODO: write these tests so they can fail and succeed independently
    before(async () => {
      await schemas.Events.insertAll(eventGroup2)
    })
    it('responds with event Summary', (done) => {
      request(server)
        .get(`/eventSummary/${eventGroup2[1].merchant}`)
        .expect(200)
        .end((err, resp) => {
          expect(err).to.eql(null)
          expect(resp.body).to.eql({
            'total_events': 3,
            'number_of_customers': 2,
            'events_summary': [
              {
                'type': 'product-view',
                'total_events': 1,
                'number_of_customers': 1
              },
              {
                'type': 'transaction',
                'total_events': 2,
                'number_of_customers': 2,
                'total_value': 110
              }
            ]
          })
          done()
        })
    })

    it('responds with 404 when no document is found', (done) => {
      request(server)
        .get(`/eventSummary/fakeMerchantId`)
        .expect(404)
        .end((err, resp) => {
          expect(err).to.eql(null)
          done()
        })
    })
  })

})
