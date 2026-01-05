/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
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
                hostname: 'superlend-assets.s3.ap-south-1.amazonaws.com',
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
        minimumCacheTTL: 60 * 60 * 24 * 14, // 14 days
    },
    webpack: (config) => {
        config.resolve.fallback = { fs: false, net: false, tls: false }
        return config
    },
}

export default nextConfig
