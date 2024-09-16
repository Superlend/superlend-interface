import { Opportunity, columns } from "@/data/top-apy-opportunities"
import { DataTable } from "@/components/ui/data-table"

export async function getTopApyOpportunitiesDummyData(): Promise<Opportunity[]> {
    // Fetch data from your API here.
    return [
        {
            token: "wBTC",
            chain: "Polygon",
            platform: "Aave",
            apy: "11.48%",
            max_ltv: "84%",
            deposits: "$438.6k",
            utilization: "32.7%",
            token_image: "/images/tokens/btc.webp",
            chain_image: "/images/chains/matic.webp",
            platform_image: "/images/platforms/aave.webp",
        },
        {
            token: "USDC",
            chain: "Op",
            platform: "Compound",
            apy: "11.48%",
            max_ltv: "84%",
            deposits: "$438.6k",
            utilization: "32.7%",
            token_image: "/images/tokens/usdc.webp",
            chain_image: "/images/chains/op.webp",
            platform_image: "/images/platforms/compound.webp",
        },
        {
            token: "wBTC",
            chain: "matic",
            platform: "Euler",
            apy: "11.48%",
            max_ltv: "84%",
            deposits: "$438.6k",
            utilization: "32.7%",
            token_image: "/images/tokens/btc.webp",
            chain_image: "/images/chains/matic.webp",
            platform_image: "/images/platforms/euler.webp",
        },
        {
            token: "Eth",
            chain: "matic",
            platform: "Morpho",
            apy: "11.48%",
            max_ltv: "84%",
            deposits: "$438.6k",
            utilization: "32.7%",
            token_image: "/images/tokens/eth.webp",
            chain_image: "/images/chains/matic.webp",
            platform_image: "/images/platforms/morpho.webp",
        },
    ]
}

export default async function TopApyOpportunitiesTable() {
    const data = await getTopApyOpportunitiesDummyData()

    return (
        <div className="container mx-auto py-10">
            <DataTable columns={columns} data={data} />
        </div>
    )
}
