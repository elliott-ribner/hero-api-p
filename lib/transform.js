const _ = require('lodash')
const fetch = require('./fetch')

const transform = {
  // TODO: this could optimized by fetching limiting the feilds retreived from the query,
  // also we might prefer to do the counts with mongo projections
  summary: (events) => {
    const productViewCustomerMap = {}
    const transactionCustomerMap = {}
    const output = {
      'total_events': 0,
      'number_of_customers': 0,
      'events_summary': [
        {
          'type': 'product-view',
          'total_events': 0,
          'number_of_customers': 0
        },
        {
          'type': 'transaction',
          'total_events': 0,
          'number_of_customers': 0,
          'total_value': 0
        }
      ]
    }
    const productViews = output.events_summary[0]
    const transactions = output.events_summary[1]
    for (let event of events) {
      if (event.type === 'product-view') {
        productViews.total_events ++
        productViewCustomerMap[event.user] = true
      } else if (event.type === 'transaction') {
        transactions.total_events ++
        transactionCustomerMap[event.user] = true
        transactions.total_value += event.data.transaction.total
      }
    }
    productViews.number_of_customers = Object.keys(productViewCustomerMap).length
    transactions.number_of_customers = Object.keys(transactionCustomerMap).length
    output.number_of_customers = Object.keys(Object.assign({}, productViewCustomerMap, transactionCustomerMap)).length
    output.total_events = productViews.total_events + transactions.total_events
    return output
  },

  extendProducts: async (events) => {
    const incompleteProducts = []
    const incompleteProductMap = {}
      // TODO: apply fetched data to these products instead of stubbed method response
    for (let event of events) {
      if (event.type === 'product-view') {
        const wrappedPromise = fetch.product(event.data.product.sku_code, event.merchant).then((extraProductData) => {
          incompleteProductMap[`${event.data.product.sku_code}-${event.merchant}`] = extraProductData
        }).catch((e) => {
          console.log(e)
        })
        incompleteProducts.push(wrappedPromise)
      } else if (_.get(event, 'data.transaction.line_items')) {
        for (let lineItem of event.data.transaction.line_items) {
          const wrappedPromise = fetch.product(lineItem.product.sku_code, event.merchant).then((extraProductData) => {
            incompleteProductMap[`${lineItem.product.sku_code}-${event.merchant}`] = extraProductData
          }).catch((e) => {
            console.log(e)
          })
          incompleteProducts.push(wrappedPromise)
        }
      }
    }
    // promises are throw into an array above and pass them into a promise.all to increase speed
    await Promise.all(incompleteProducts)
    for (let event of events) {
      if (event.type === 'product-view') {
        const extraProductData = incompleteProductMap[`${event.data.product.sku_code}-${event.merchant}`] || {}
        event.data.product = {
          ...event.data.product,
          ...extraProductData
        }
      } else if (_.get(event, 'data.transaction.line_items')) {
        for (let lineItem of event.data.transaction.line_items) {
          const extraProductData = incompleteProductMap[`${lineItem.product.sku_code}-${event.merchant}`] || {}
          lineItem.product = {
            ...lineItem.product,
            ...extraProductData
          }
        }
      }
    }
    return events
  }
}

module.exports = transform
