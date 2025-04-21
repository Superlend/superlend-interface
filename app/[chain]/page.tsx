import { notFound } from 'next/navigation'
import DiscoverPageComponents from './page-components'

// Validate allowed chain values
const VALID_CHAINS = ['discover', 'etherlink', 'polygon']

export default async function ChainPage({ params }: { params: { chain: string } }) {
    const { chain } = params

    // Validate chain parameter
    if (!VALID_CHAINS.includes(chain)) {
        notFound()
    }

    return <DiscoverPageComponents chain={chain} />
}

// Add route segment config to restrict valid chains
export const dynamicParams = false // Only allow defined chains 