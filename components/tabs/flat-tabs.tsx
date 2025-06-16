import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FlatTabs({
    tabs,
    activeTab,
    onTabChange,
}: {
    tabs: {
        label: string;
        value: string;
        content: React.ReactNode;
        disabled?: boolean;
        show?: boolean;
    }[];
    activeTab: string;
    onTabChange: (tab: string) => void;
}) {
    return (
        <Tabs
            value={activeTab}
            onValueChange={onTabChange}
            className="w-full"
        >
            <div className="sticky top-[56px] md:top-[74px] bg-transparent backdrop-blur-md rounded-4 z-10">
                <TabsList className="w-full bg-transparent">
                    {tabs.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value} className="flex-1 pt-4 md:pt-2 pb-4 bg-transparent uppercase rounded-none text-gray-500 border-b-[1px] border-gray-500 data-[state=active]:text-secondary-500 data-[state=active]:border-secondary-500 data-[state=active]:border-b-[2px] data-[state=active]:bg-transparent">
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>
            {tabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="w-full pt-6">
                    {tab.content}
                </TabsContent>
            ))}
        </Tabs>
    )
}