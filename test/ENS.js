/* global web3:true, assert:true, artifacts:true, contract:true */
/* eslint-env mocha */

import { default as ENSAuctionLib } from '../lib/ens_registrar'
let Registrar = artifacts.require('./Registrar.sol')
let Web3 = require('web3')

contract('ENS integration', (accounts) => {
  let registrar
  let auctionRegistrar

  before('set up auction registrar', () => {
    registrar = Registrar.deployed()
    auctionRegistrar = new ENSAuctionLib(
        new Web3.providers.HttpProvider('http://testrpc:8545'),
        registrar.address,
        accounts[0]
    )
  })

  it('demonstrates that the domain name isn\'t available', (done) => {
    auctionRegistrar.available('test')
      .then((isAvailable) => {
        assert.isTrue(isAvailable)
        done()
      })
  })

  it('demonstrates that the domain name isn\'t up for auction', (done) => {
    auctionRegistrar.upForAuction('test')
      .then((isUpForAuction) => {
        assert.isFalse(isUpForAuction)
        done()
      })
  })

  it('can start an auction', (done) => {
    auctionRegistrar.startAuction('test')
      .then((started) => {
        assert.isTrue(started)
        done()
      })
  })

  it('can start a bid', (done) => {
    auctionRegistrar.createBid('test', accounts[0], '1.123', web3.sha3('secret'))
      .then(() => registrar.entries(web3.sha3('test')))
      .then((entry) => {
        assert.isAbove(entry[2].toNumber() * 1000, Date.now(),
                       'the end date of the bid is greater than now')
        done()
      })
  })

  it('can reveal a bid', (done) => {
    auctionRegistrar.createBid('test', accounts[0], '.123', web3.sha3('secret'))
      .then((bidCreated) => {
        assert.isTrue(bidCreated)
        return registrar.entries(web3.sha3('test'))
      })
      .then((entry) => Promise.resolve(assert.isAbove(entry[2].toNumber() * 1000,
                                       Date.now(),
                                       'the end date of the bid is greater than now')))
      .then(() => auctionRegistrar.revealBid('test', accounts[0], '.123', web3.sha3('secret')))
      .then(() => auctionRegistrar.currentWinner('test'))
      .then((owner) => {
        assert.equal(owner, accounts[0], 'owner of the winning bid is correct')
        done()
      })
      .catch(done)
  })
})