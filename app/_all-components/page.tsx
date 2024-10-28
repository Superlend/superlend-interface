import React from 'react';
import { Button } from "@/components/ui/button";
import { BodyText, HeadingText, Label } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
// import GraphDropdown from "@/components/dropdowns/GraphDropdown";
import ChainSelectorDropdown from "@/components/dropdowns/ChainSelectorDropdown";
// import DiscoverFiltersDropdown from "@/components/dropdowns/DiscoverFiltersDropdown";
// import LendBorrowToggle from '@/components/LendBorrowToggle';
import SearchInput from '@/components/inputs/SearchInput';

export default async function ComponentsPage() {

    return (
        <main className="flex flex-col gap-5 max-w-[1200px] w-full mx-auto pb-10">
            <ComponentCard>
                <HeadingText level="h1">Heading 1</HeadingText>
                <HeadingText level="h2">Heading 2</HeadingText>
                <HeadingText level="h3">Heading 3</HeadingText>
                <HeadingText level="h4">Heading 4</HeadingText>
                <HeadingText level="h5">Heading 5</HeadingText>
                <HeadingText level="h6">Heading 6</HeadingText>
            </ComponentCard>
            <ComponentCard hasDivider>
                <ComponentCardSection>
                    <BodyText level="body1" weight="normal">Body 1 - normal Text</BodyText>
                    <BodyText level="body1" weight="bold">Body 1 - bold Text</BodyText>
                </ComponentCardSection>
                <ComponentCardSection>
                    <BodyText level="body2" weight="normal">Body 2 - normal Text</BodyText>
                    <BodyText level="body2" weight="bold">Body 2 - bold Text</BodyText>
                </ComponentCardSection>
            </ComponentCard>
            <ComponentCard>
                <Label size="small" weight="normal">Label - small normal Text</Label>
                <Label size="small" weight="bold">Label - small bold Text</Label>
            </ComponentCard>
            <ComponentCard>
                <Button className='max-w-[250px] w-full' variant="primary" size="lg">Primary Button</Button>
                <Button className='max-w-[250px] w-full' variant="secondary" size="lg">Secondary Button</Button>
                <Button className='max-w-[250px] w-full' variant="secondaryOutline" size="lg">Secondary Outline Button</Button>
                <Button className='max-w-[250px] w-full' variant="outline" size="lg">Outline Button</Button>
                <Button className='max-w-[250px] w-full' variant="destructive" size="lg">Destructive Button</Button>
                <Button className='max-w-[250px] w-fit' variant="link" size="lg">Link Button</Button>
            </ComponentCard>
            <ComponentCard>
                <Badge className="w-fit" variant="default" size="sm">Default Small Badge</Badge>
                <Badge className="w-fit selected" variant="default" size="sm">Default Selected Small Badge</Badge>
                <Badge className="w-fit" variant="default" size="md">Default Medium Badge</Badge>
                <Badge className="w-fit" variant="default" size="lg">Default Large Badge</Badge>
                <Badge className="w-fit" variant="secondary">Secondary Badge</Badge>
                <Badge className="w-fit" variant="destructive">Destructive Badge</Badge>
                <Badge className="w-fit" variant="link">Link Badge</Badge>
                <Badge className="w-fit" variant="green">Green Badge</Badge>
                <Badge className="w-fit" variant="blue">Blue Badge</Badge>
            </ComponentCard>
            {/* <ComponentCard>
                <GraphDropdown />
            </ComponentCard> */}
            <ComponentCard>
                <ChainSelectorDropdown />
            </ComponentCard>
            {/* <ComponentCard>
                <DiscoverFilterDropdown />
            </ComponentCard> */}
            {/* <ComponentCard>
                <LendBorrowToggle />
            </ComponentCard> */}
            <ComponentCard>
                <div className="max-w-[250px] w-full">
                    <SearchInput />
                </div>
            </ComponentCard>
        </main>
    )
}

function ComponentCardSection({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2 [&:nth-child(n+2)]:pt-3">
            {children}
        </div>
    );
}

function ComponentCard({ children, className, hasDivider }: { children: React.ReactNode, className?: string, hasDivider?: boolean }) {
    return (
        <div className={`ring-2 ring-sky-300 p-5 rounded-lg flex flex-col gap-3 ${hasDivider ? 'divide-y divide-sky-400' : ''} ${className || ""}`}>
            {children}
        </div>
    );
}
