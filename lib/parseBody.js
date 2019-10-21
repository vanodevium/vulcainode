const client = require('./http-client')
const _get = require('lodash.get')
const pushStream = require('./pushStream')
const bluebird = require('bluebird')

module.exports = async function parseBody (level, paths, nestedParts, body, fields, request, fastify, cache) {
  const path = paths[level]

  if (!nestedParts.length && path) {
    nestedParts = path.split('/').filter((el) => !!el)
  }

  try {
    if (!nestedParts[0]) {
      return bluebird.resolve()
    }

    const nestedPart = `/${nestedParts[0]}/`

    const jsonPath = nestedPart.replace(/\/$/, '')

    let parsed = JSON.parse(body)

    if (!Array.isArray(parsed)) {
      parsed = [parsed]
    }

    let matches

    for (const obj of parsed) {
      matches = _get(obj, toDotSyntax(jsonPath))

      if (!matches) {
        continue
      }
      if (!Array.isArray(matches)) {
        matches = [matches]
      }

      if (matches && Array.isArray(matches)) {
        await bluebird.all(matches.map((match) => {
          if (match.charAt(0) !== '/') {
            return bluebird.resolve()
          }

          return client(match, request.raw.method, cache)
            .then((response) => {
              if (!response.body) {
                return bluebird.resolve()
              }

              if (!cache[match]) {
                cache[match] = response
              }

              pushStream(match, toDotSyntax(jsonPath), fields, response, request, fastify)
              const nested = nestedParts.length > 1 ? nestedParts.slice(1) : []
              return parseBody(level + 1, paths, nested, response.body, fields, request, fastify, cache)
            })
        }))
      }
    }
  } catch (e) {
    console.log(e)
    fastify.log.warn(e)
  }
}

function toDotSyntax (jsonPath) {
  return jsonPath.trim().replace(/\/?\*/g, '[]').replace(/\//g, '.').replace(/^\./, '')
}

// function toJqSyntax (jsonPath) {
//   return jsonPath.trim().replace(/\/?\*/g, '[]').replace(/\//g, '.')
// }
