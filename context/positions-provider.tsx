"use client"

import { TPositionType } from "@/types";
import { createContext, Dispatch, SetStateAction, useState } from "react";

export type TPositionsFilters = {
    token_ids: string[],
    chain_ids: number[];
    platform_ids: string[];
}

export type TPositionsContext = {
    filters: TPositionsFilters,
    setFilters: Dispatch<SetStateAction<TPositionsFilters>>,
    positionType: TPositionType,
    setPositionType: Dispatch<SetStateAction<TPositionType>>,
}

const filtersInit = {
    token_ids: [],
    chain_ids: [],
    platform_ids: [],
}

const positionTypeInit: TPositionType = "lend";

export const PositionsContext = createContext<TPositionsContext>({
    filters: filtersInit,
    setFilters: () => { },
    positionType: positionTypeInit,
    setPositionType: () => { },
});

export default function PositionsProvider({ children }: { children: React.ReactNode }) {
    const [positionType, setPositionType] = useState<TPositionType>(positionTypeInit);
    const [filters, setFilters] = useState<TPositionsFilters>(filtersInit);

    return (
        <PositionsContext.Provider value={{ filters, setFilters, positionType, setPositionType }}>
            {children}
        </PositionsContext.Provider>
    )
}