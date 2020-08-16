const rp = require('request-promise-native')
const sinon = require('sinon')

const fetch = {
  product: async (productId, merchantId) => {
    try {
      const requestOptions = {
        uri: `https://dev.backend.usehero.com/products/${productId}`,
		    headers: {
		        'x-hero-merchant-id': merchantId
		    },
		    json: true
      }
      const resp = await rp(requestOptions)
      // TODO: I am not sure about the response structure, the return statement may need to be changed when stub is removed
      return resp.data
    } catch (e) {
      console.log(e)
    }
  }
}

// I am getting no response when trying the curl command posted in the directions.
// I am operating under the assumption that the endpoint is not currently functioning as intended.
// Instead I have stubbed the method as a temporary solution.
const stubbedProductExtension = {
  name: 'Fake product name',
  category: 'Outerwear',
  genderCategory: 'Mens'
}
sinon.stub(fetch, 'product').callsFake(() => {
  return new Promise((resolve, reject) => resolve(stubbedProductExtension))
})

module.exports = fetch
