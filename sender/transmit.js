'use strict'

const request = require('request');
const Reducer = require('../optimization').Reducer;

/*
*  This function will be called for each event.  (eg: for each sensor reading)
*  Modify it as needed.
*/
const reducer = new Reducer("deviceId");
module.exports = function (eventMsg, encoding, callback) {
  let [isReduced, diff] = reducer.reduce(eventMsg);
  let obj = {
    _reduced: isReduced,
    data: diff
  };
  request.post('http://localhost:8080/event', { json: true, body: obj }, (err, res, body) => {
    callback(err);
  })
}
