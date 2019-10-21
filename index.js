require('dotenv').config()

const httpsLocalhost = require('https-localhost')()
const Fastify = require('fastify')
const qs = require('fastify-qs')
const readFileSync = require('fs').readFileSync
const bluebird = require('bluebird')
const yesNo = require('yn')

const client = require('./lib/http-client')
const parseBody = require('./lib/parseBody')
const pickBody = require('./lib/pickBody');

(async function () {
  const certs = await httpsLocalhost.getCerts()
  const fastify = Fastify({
    logger: yesNo(process.env.LOGGER),
    http2: true,
    https: Object.assign({}, certs, { allowHTTP1: true })
  })

  fastify.register(qs, {})

  fastify.get('/index', {}, function (request, reply) {
    console.log('123')
    reply.header('content-type', 'text/html')
    reply.send(readFileSync('./examples/index.html').toString().replace('{port}', fastify.server.address().port))
  })

  fastify.get('/raw', {}, function (request, reply) {
    reply.header('content-type', 'text/html')
    reply.send(readFileSync('./examples/raw.html').toString().replace('{upstream}', process.env.UPSTREAM))
  })

  fastify.all('/', {}, reply)
  fastify.all('/*', {}, reply)

  async function reply (request, reply) {
    const preloadHeader = request.headers.preload
    delete request.headers.preload

    const fieldsHeader = request.headers.fields
    delete request.headers.fields

    const response = await client(request.raw.url, request.raw.method)

    const body = response.body

    if (!request.raw.stream) {
      reply.send(body)
      return
    }

    let preloads

    if (preloadHeader) {
      preloads = splitPreloadHeader(preloadHeader)
    }

    let fields

    if (fieldsHeader) {
      fields = splitFieldsHeader(fieldsHeader)
    }

    preloads && await bluebird.all(
      preloads.map(function (preload) {
        const paths = splitPreload(preload)
        return parseBody(0, paths, [], body, fields, request, fastify, {})
      })
    )

    reply.send(pickBody(body, '/', fields))
  }

  if (!process.env.PORT) {
    console.warn('///////////////////////////////////////////////////')
    console.warn('Maybe, you forgot to set PORT environment variable?')
    console.warn('///////////////////////////////////////////////////')
  }
  await fastify.listen(process.env.PORT)
})()

function splitPreloadHeader (preload) {
  return preload.replace(' ', '').split(',').filter((el) => !!el)
}

function splitPreload (preload) {
  return preload.replace(/^\/?\*/, '').split('*').filter((el) => !!el)
}

function splitFieldsHeader (fields) {
  const fieldsMap = {}
  fields.split('/').map((field) => {
    const split = field.split(':')
    if (split.length === 2) {
      fieldsMap[split[0] ? split[0] : '/'] = split[1].replace(' ', '').split(',').filter((el) => !!el)
    }
  })

  if (Object.keys(fieldsMap).length) {
    return fieldsMap
  }
}
