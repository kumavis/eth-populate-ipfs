const rpcToBlock = require('ethereumjs-rpc-sync/materialize-block')
const request = require('request')
const async = require('async')
const ethUtil = require('ethereumjs-util')

const RPC_ENDPOINT = 'http://localhost:8545/'

module.exports = downloadBlock


function downloadBlock(num, cb){
  getBlockByNumber(num, function(err, blockParams){
    if (err) return cb(err)
    async.map(blockParams.uncles, function lookupUncle(uncleHash, cb){
      var uncleIndex = blockParams.uncles.indexOf(uncleHash)
      getUncleByBlockHashAndIndex(blockParams.hash, uncleIndex, cb)
    }, function(err, uncles){
      if (err) return cb(err)
      var block = rpcToBlock(blockParams, uncles)
      cb(null, block)
    })
  })
}

function getBlockByNumber(num, cb){
  performRpcRequest({
    id: 1,
    jsonrpc: '2.0',
    method: 'eth_getBlockByNumber',
    params: [ethUtil.intToHex(num), true],
  }, function(err, res){
    if (err) return cb(err)
    cb(null, res.result)
  })
}

function getUncleByBlockHashAndIndex(hash, index, cb){
  performRpcRequest({
    id: 1,
    jsonrpc: '2.0',
    method: 'eth_getUncleByBlockHashAndIndex',
    params: [hash, ethUtil.intToHex(index)],
  }, function(err, res){
    if (err) return cb(err)
    cb(null, res.result)
  })
}

function performRpcRequest(payload, cb){
  request({
    uri: RPC_ENDPOINT,
    method: 'POST',
    json: payload,
  }, function(err, res, body){
    if (err) return cb(err)
    if (body && body.error) return cb(body.error.message)
    // console.log(payload,'->',body)
    cb(null, body)
  })
}
