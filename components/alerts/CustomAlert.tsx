import { InfoIcon, TriangleAlert } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import DangerSquare from '@/components/icons/danger-square';

export default function CustomAlert({
    variant = "destructive",
    description
}: {
    variant?: "destructive" | "warning" | "info",
    description: React.ReactNode | string
}) {
    return (
        <Alert variant={variant}>
            <AlertDescription className='flex items-center justify-center gap-2'>
                {variant === "destructive" && <DangerSquare width={18} height={18} className='stroke-destructive-foreground shrink-0' />}
                {variant === "warning" && <TriangleAlert width={18} height={18} className='stroke-warning-foreground shrink-0' />}
                {variant === "info" && <InfoIcon width={18} height={18} className='stroke-info-foreground shrink-0' />}
                {typeof description === "string" && <span className="leading-0 font-medium">
                    {description}
                </span>}
                {typeof description !== "string" && description}
            </AlertDescription>
        </Alert>
    )
}  