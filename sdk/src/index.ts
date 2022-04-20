export const getConfig = env => {
  switch (env) {
    case 'sandbox':
    case 'local':
    default:
      return {
        networkId: 'sandbox',
        nodeUrl: 'http://localhost:3030',
        masterAccount: 'test.near',
        contractAccount: 'status-message.test.near',
        keyPath: '/tmp/near-sandbox/validator_key.json'
      }
  }
}
