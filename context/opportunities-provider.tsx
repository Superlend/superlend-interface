"use client"

import { TPositionType } from "@/types";
import { createContext, useState } from "react";

export type TOpportunitiesFilters = {
    token_ids: string[],
    chain_ids: number[];
    platform_ids: string[];
}

export const OpportunitiesContext = createContext<any>({
    token_ids: [],
    chain_ids: [],
    platform_ids: []
});

export default function OpportunitiesProvider({ children }: { children: React.ReactNode }) {
    const [positionType, setPositionType] = useState<TPositionType>("lend");
    const [filters, setFilters] = useState<TOpportunitiesFilters>({
        token_ids: [],
        chain_ids: [],
        platform_ids: []
    });

    return (
        <OpportunitiesContext.Provider value={{ filters, setFilters, positionType, setPositionType }}>
            {children}
        </OpportunitiesContext.Provider>
    )
}