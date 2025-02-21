export default () => ({
  environment: process.env.NODE_ENV || `development`,
  postgres: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  priceFeed: {
    apiKeyProd: process.env.CMC_API_KEY,
    apiKeyDev: 'b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c',
    baseUrlProd: 'https://pro-api.coinmarketcap.com',
    baseUrlDev: 'https://sandbox-api.coinmarketcap.com',
  },
  arweave: {
    address: process.env.ARWEAVE_ADDRESS,
  },
  solana: {
    address: process.env.SOLANA_ADDRESS,
  },
  evm: {
    address: process.env.EVM_ADDRESS,
  },
});
