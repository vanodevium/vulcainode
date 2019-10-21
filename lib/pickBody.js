const _pick = require('lodash.pick')

module.exports = function (body, path = '/', fields) {
  if (!path || !fields || !fields[path] || !fields[path].length) {
    return body
  }

  const parsed = JSON.parse(body)

  if (Array.isArray(parsed)) {
    return JSON.stringify(parsed.map(function (item) {
      return _pick(item, fields[path])
    }))
  }

  return JSON.stringify(_pick(parsed, fields[path]))
}
