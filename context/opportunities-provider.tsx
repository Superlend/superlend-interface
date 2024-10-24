"use client"

import { TPositionType } from "@/types";
import { createContext, useState } from "react";

export type TOpportunitiesFilters = {
    token_ids: string[],
    chain_ids: number[];
    platform_ids: string[];
    deposits_range: {
        from: number,
        to: number
    };
}

export const OpportunitiesContext = createContext<any>({
    token_ids: [],
    chain_ids: [],
    platform_ids: [],
    deposits_range: {
        from: 0,
        to: 10000
    }
});

export default function OpportunitiesProvider({ children }: { children: React.ReactNode }) {
    const [positionType, setPositionType] = useState<TPositionType>("lend");
    const [filters, setFilters] = useState<TOpportunitiesFilters>({
        token_ids: [],
        chain_ids: [],
        platform_ids: [],
        deposits_range: {
            from: 0,
            to: 10000
        }
    });

    return (
        <OpportunitiesContext.Provider value={{ filters, setFilters, positionType, setPositionType }}>
            {children}
        </OpportunitiesContext.Provider>
    )
}