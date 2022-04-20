// import nearAPI from 'near-api-js'
const nearAPI = require('near-api-js')
import BN from 'bn.js'
import fs from 'fs'
import { assert } from 'chai'
import { getConfig } from '../sdk/src/index'

const contractMethods = {
  viewMethods: ['get_status'],
  changeMethods: ['set_status']
}

describe('test', () => {
  let config
  let masterAccount
  let masterKey
  let pubKey
  let keyStore
  let near

  before(async () => {
    config = getConfig(process.env.NEAR_ENV || 'sandbox')
    const keyFile = require(config.keyPath)
    masterKey = nearAPI.utils.KeyPair.fromString(keyFile.secret_key || keyFile.private_key)
    pubKey = masterKey.getPublicKey()
    keyStore = new nearAPI.keyStores.InMemoryKeyStore()
    keyStore.setKey(config.networkId, config.masterAccount, masterKey)
    near = await nearAPI.connect({
      deps: {
        keyStore
      },
      networkId: config.networkId,
      nodeUrl: config.nodeUrl
    })
    masterAccount = new nearAPI.Account(near.connection, config.masterAccount)
  })

  it('test', async () => {
    async function createContractUser(accountPrefix, contractAccountId, contractMethods) {
      let accountId = accountPrefix + '.' + config.masterAccount
      await masterAccount.createAccount(accountId, pubKey, new BN(10).pow(new BN(25)))
      keyStore.setKey(config.networkId, accountId, masterKey)
      const account = new nearAPI.Account(near.connection, accountId)
      const accountUseContract = new nearAPI.Contract(account, contractAccountId, contractMethods)
      return accountUseContract
    }

    async function initTest() {
      const contract = fs.readFileSync('./out/template.wasm')
      const _contractAccount = await masterAccount.createAndDeployContract(
        config.contractAccount,
        pubKey,
        contract,
        new BN(10).pow(new BN(25))
      )

      const aliceUseContract = await createContractUser(
        'alice',
        config.contractAccount,
        contractMethods
      )

      const bobUseContract = await createContractUser(
        'bob',
        config.contractAccount,
        contractMethods
      )
      console.log('Finish deploy contracts and create test accounts')
      return { aliceUseContract, bobUseContract }
    }

    async function test() {
      // 1. Creates testing accounts and deploys a contract
      const { aliceUseContract, bobUseContract } = await initTest()

      // 2. Performs a `set_status` transaction signed by Alice and then calls `get_status` to confirm `set_status` worked
      await (aliceUseContract as any).set_status({ args: { message: 'hello' } })
      let alice_message = await (aliceUseContract as any).get_status({
        account_id: 'alice.test.near'
      })
      assert.equal(alice_message, 'hello')

      // 3. Gets Bob's status and which should be `null` as Bob has not yet set status
      let bob_message = await (bobUseContract as any).get_status({
        account_id: 'bob.test.near'
      })
      assert.equal(bob_message, null)

      // 4. Performs a `set_status` transaction signed by Bob and then calls `get_status` to show Bob's changed status and should not affect Alice's status
      await (bobUseContract as any).set_status({ args: { message: 'world' } })
      bob_message = await (bobUseContract as any).get_status({
        account_id: 'bob.test.near'
      })
      assert.equal(bob_message, 'world')
      alice_message = await (aliceUseContract as any).get_status({
        account_id: 'alice.test.near'
      })
      assert.equal(alice_message, 'hello')
    }
    await test()
  })
})
