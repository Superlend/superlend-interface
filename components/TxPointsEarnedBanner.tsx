import { TrophyIcon } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { BodyText } from "./ui/typography"
import Link from "next/link"

export default function TxPointsEarnedBanner() {
    return (
        <Card className="max-w-full w-full">
            <CardContent className="p-4 flex flex-col gap-3 bg-white relative rounded-6">
                <div className="flex items-center gap-4">
                    <div className="bg-[#FFFFCC] rounded-full p-1 w-12 h-12 flex items-center justify-center shrink-0">
                        <TrophyIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <BodyText level="body2" weight="medium">
                            Transaction successful
                        </BodyText>
                        <BodyText level="body3" weight="normal">
                            Your superxp points will appear after the current epoch ends.
                            <Link href="/points" className="text-secondary-500 ml-1">Learn more</Link>
                        </BodyText>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}