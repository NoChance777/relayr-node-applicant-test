'use strict'

/*
*  Modify this file as needed.
*/

const http = require('http')
const Reducer = require('../optimization').Reducer;

process.on('SIGTERM', function () {
  process.exit(0)
})
const reducer = new Reducer("deviceId");
const server = http.createServer(function (req, res) {
  let body = []
  req.on('data', body.push.bind(body))
  req.on('end', () => {
    let obj = JSON.parse(Buffer.concat(body).toString());
    if (obj._reduced) [, obj.data] = reducer.restore(obj.data);
    // just print to stdout
    console.log(JSON.stringify(obj.data));

    res.end();
  })
})

server.listen(8080)
