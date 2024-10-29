"use client"

import { TPositionType } from "@/types";
import { createContext, useState } from "react";

export type TOpportunitiesFilters = {
    token_ids: string[],
    chain_ids: number[];
    protocol_identifiers: string[];
}

export const OpportunitiesContext = createContext<any>({
    token_ids: [],
    chain_ids: [],
    protocol_identifiers: []
});

export default function OpportunitiesProvider({ children }: { children: React.ReactNode }) {
    const [positionType, setPositionType] = useState<TPositionType>("lend");
    const [filters, setFilters] = useState<TOpportunitiesFilters>({
        token_ids: [],
        chain_ids: [],
        protocol_identifiers: []
    });

    return (
        <OpportunitiesContext.Provider value={{ filters, setFilters, positionType, setPositionType }}>
            {children}
        </OpportunitiesContext.Provider>
    )
}