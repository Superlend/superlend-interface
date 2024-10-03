"use client"

import { createContext, useState } from "react";

export type TOpportunitiesFilters = {
    chain_ids: number[];
    platform_ids: string[];
}

export const OpportunitiesContext = createContext<any>({
    chain_ids: [],
    platform_ids: []
});

export default function OpportunitiesProvider({ children }: { children: React.ReactNode }) {
    const [filters, setFilters] = useState<TOpportunitiesFilters>({
        chain_ids: [],
        platform_ids: []
    });

    return (
        <OpportunitiesContext.Provider value={{ filters, setFilters }}>
            {children}
        </OpportunitiesContext.Provider>
    )
}