const DAYS30_IN_SECONDS = 2592000 // 60 * 60 * 24 * 30
const DAYS14_IN_SECONDS = 1209600 // 60 * 60 * 24 * 14

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                hostname: 'superlend-assets.s3.ap-south-1.amazonaws.com',
                minimumCacheTTL: DAYS14_IN_SECONDS,
            },
            {
                hostname: 'coin-images.coingecko.com',
                minimumCacheTTL: DAYS30_IN_SECONDS,
            },
            {
                hostname: 'cdn.morpho.org',
                minimumCacheTTL: DAYS30_IN_SECONDS,
            },
            {
                hostname: 'www.etherlink.com',
                minimumCacheTTL: DAYS30_IN_SECONDS,
            },
            {
                hostname: 'raw.githubusercontent.com',
                minimumCacheTTL: DAYS30_IN_SECONDS,
            },
            {
                hostname: 'superlend-public-assets.s3.ap-south-1.amazonaws.com',
                minimumCacheTTL: DAYS14_IN_SECONDS,
            },
            {
                hostname: 'cdn.whisk.so',
                minimumCacheTTL: DAYS30_IN_SECONDS,
            },
            {
                hostname: 'cryptologos.cc',
                minimumCacheTTL: DAYS30_IN_SECONDS,
            },
            {
                hostname: 'funds.superlend.xyz',
                minimumCacheTTL: DAYS14_IN_SECONDS,
            },
            {
                hostname: 'app.aave.com',
                minimumCacheTTL: DAYS30_IN_SECONDS,
            },
        ],
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy:
            "default-src 'self'; script-src 'none'; sandbox;",
        contentSecurityPolicy:
            "default-src 'self'; script-src 'none'; sandbox;",
        minimumCacheTTL: DAYS14_IN_SECONDS,
    },
    webpack: (config) => {
        config.resolve.fallback = { fs: false, net: false, tls: false }
        return config
    },
}

export default nextConfig
