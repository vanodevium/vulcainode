const http2 = require('http2')
const _pickBody = require('./pickBody')

function pushStream (path, resource, fields, response, request, fastify) {
  try {
    if (!request.raw.stream.pushAllowed) {
      return
    }

    request.raw.stream.pushStream({
      [http2.constants.HTTP2_HEADER_METHOD]: request.raw.method,
      [http2.constants.HTTP2_HEADER_PATH]: path
    }, { parent: request.raw.stream.id }, function (err, stream) {
      if (err) {
        fastify.log.warn(err)
        return
      }

      stream.on('error', (error) => { fastify.log.warn(error) })

      if (!stream.destroyed) {
        stream.respond({ [http2.constants.HTTP2_HEADER_STATUS]: response.statusCode })
      }

      stream.end(_pickBody(response.body, resource, fields))
    })
  } catch (error) {
    fastify.log.warn(error)
  }
}

module.exports = pushStream
