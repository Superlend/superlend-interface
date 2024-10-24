export default function TooltipText({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-block border-b border-dashed border-gray-800">
            {children}
        </span>
    )
}