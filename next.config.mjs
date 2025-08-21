const DAYS30_IN_SECONDS = 2592000 // 60 * 60 * 24 * 30
const DAYS14_IN_SECONDS = 1209600 // 60 * 60 * 24 * 14

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                hostname: 'superlend-assets.s3.ap-south-1.amazonaws.com',
            },
            {
                hostname: 'coin-images.coingecko.com',
            },
            {
                hostname: 'cdn.morpho.org',
            },
            {
                hostname: 'www.etherlink.com',
            },
            {
                hostname: 'raw.githubusercontent.com',
            },
            {
                hostname: 'superlend-public-assets.s3.ap-south-1.amazonaws.com',
            },
            {
                hostname: 'cdn.whisk.so',
            },
            {
                hostname: 'cryptologos.cc',
            },
            {
                hostname: 'funds.superlend.xyz',
            },
            {
                hostname: 'app.aave.com',
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
