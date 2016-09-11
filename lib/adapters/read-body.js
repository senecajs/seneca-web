/**
 * Helper to read the body from a request stream
 * @param  {object}   request  the request
 * @param  {Function} callback the callback
 */
module.exports = function getBody (request, callback) {
  var body = ''

  request.on('error', function (err) {
    callback(err)
  })

  request.on('data', (chunk) => {
    body += chunk
  })
  request.on('end', () => {
    callback(null, body)
  })
}
