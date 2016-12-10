const EthBlockHeader = require('ethereumjs-block/header')
const IpldEthBlock = require('ipld-eth-block')
const IpfsBlock = require('ipfs-block')
const getIPFS = require('ipfs/src/cli/utils.js').getIPFS
const async = require('async')
const rlp = require('rlp')
const CID = require('cids')
const downloadBlock = require('./download-block.js')
const ethUtil = require('ethereumjs-util')


getIPFS((err, ipfs) => {
  startApp(ipfs)
})

function startApp(ipfs){
  async.series([
    (cb) => loadBlockIntoIpfs(ipfs, 420, cb),
    (cb) => loadBlockIntoIpfs(ipfs, 421, cb),
    (cb) => loadBlockIntoIpfs(ipfs, 422, cb),
  ], (err, results) => {
    if (err) throw err
    const lastCid = results[2]
    console.log(`performing lookup: "${lastCid.toBaseEncodedString()}/parent/parent/number"`)
    ipfs.dag.resolve(lastCid, 'parent/parent/number', function (err, result) {
      if (err) throw err
      console.log(ethUtil.bufferToInt(result))
    })
  })
}

function loadBlockIntoIpfs(ipfs, num, cb){
  let ethBlockHeader
  let cid
  async.waterfall([
    (cb) => downloadBlock(num, cb),
    (ethBlock, cb) => { ethBlockHeader = ethBlock.header; cb() },
    (cb) => IpldEthBlock.util.cid(ethBlockHeader, cb),
    (_cid, cb) => { cid = _cid; cb() },
    (cb) => {
      const block = new IpfsBlock(ethBlockHeader.serialize())
      ipfs.block.put(block, cid, cb)
    },
  ], (err) => {
    if (err) return cb(err)
    console.log(`put eth-block #${num} as ${cid.toBaseEncodedString()}`)
    cb(null, cid)
  })
}

// util

function showDumpBlockInstructions(ethBlockHeader){
  const rawBlock = ethBlockHeader.serialize()
  console.log('printf \''+[].map.call(rawBlock,(byte) => ('\\x'+byte.toString(16))).join('')+'\' > eth-block')
}