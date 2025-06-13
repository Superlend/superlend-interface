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
        ],
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    webpack: (config) => {
        config.resolve.fallback = { fs: false, net: false, tls: false }
        return config
    },
}

export default nextConfig
