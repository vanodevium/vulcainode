require('dotenv').config()

const httpClient = require('got')
const normalizeURL = require('normalize-url')

const upstream = process.env.UPSTREAM

if (!upstream) {
  console.error('////////////////////////////////////////')
  console.error('You must set UPSTREAM variable. Stopped!')
  console.error('////////////////////////////////////////')
  process.exit(1)
}

module.exports = async function (path, method = 'get', cache) {
  if (cache && cache[path]) {
    return Promise.resolve(cache[path])
  }

  return httpClient[method.toLowerCase()]({
    url: normalizeURL(upstream + path)
  })
}
