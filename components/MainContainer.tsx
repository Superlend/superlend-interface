import React from 'react';

interface IMainContainer {
    children: React.ReactNode;
    className?: string;
}

export default function MainContainer({ children, className }: IMainContainer) {
    return (
        <main className={`max-w-[1200px] mx-auto pb-[100px] ${className?.includes("px-0") ? "" : "px-[20px]"} ${className || ""}`}>
            {children}
        </main>
    )
}
