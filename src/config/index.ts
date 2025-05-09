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
    pk: process.env.ARWEAVE_PK,
  },
  solana: {
    address: process.env.SOLANA_ADDRESS,
    pk: process.env.SOLANA_PK,
  },
  evm: {
    address: process.env.EVM_ADDRESS,
    pk: process.env.EVM_PK,
  },
  cosmos: {
    noble: {
      address: process.env.COSMOS_NOBLE_ADDRESS,
      pk: process.env.COSMOS_NOBLE_PK,
    },
  },
  admin: {
    feeConfig: {
      addresses: {
        evm: process.env.FEE_ADDRESS_EVM,
        solana: process.env.FEE_ADDRESS_SOLANA,
        arweave: process.env.FEE_ADDRESS_ARWEAVE,
        cosmos: {
          noble: process.env.FEE_ADDRESS_COSMOS_NOBLE,
        },
      },
      feePercentage: process.env.FEE_PERCENTAGE,
    },
    arweaveJWK: process.env.AR_HOT_WALLET,
  }
});
