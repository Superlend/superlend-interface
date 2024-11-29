import { TriangleAlert } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import DangerSquare from '@/components/icons/danger-square';

export default function CustomAlert({
    description
}: {
    description: string
}) {
    return (
        <Alert variant="destructive">
            <AlertDescription className='flex items-center justify-center gap-2'>
                {/* <TriangleAlert strokeWidth={1.75} className='h-4 w-4' /> */}
                <DangerSquare width={18} height={18} className='stroke-destructive-foreground shrink-0' />
                <span className="leading-0 font-medium">
                    {description}
                </span>
            </AlertDescription>
        </Alert>
    )
}  