'use strict'

require('dotenv').config({ path: './.env' })

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing')
  process.exit(-1)
}

module.exports = {
  jwtSecret: Buffer.from(process.env.JWT_SECRET),
  jwtExpiration: parseInt(process.env.JWT_EXPIRATION || '3600', 10)
}
