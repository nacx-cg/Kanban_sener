const withNextIntl = require('next-intl/plugin')(
  './lib/i18n.ts'
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
}

module.exports = withNextIntl(nextConfig)

