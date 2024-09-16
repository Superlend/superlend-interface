'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { usePathname, useRouter } from 'next/navigation';
import HomeIcon from './icons/home-icon';
import CompassIcon from './icons/compass-icon';
import PieChartIcon from './icons/pie-chart-icon';
import { motion } from "framer-motion"
import { useMediaQuery } from "@uidotdev/usehooks";

type TTab = {
  id: number;
  name: string;
  icon: React.FC<{ height?: number, width?: number, className?: string }>;
};

const tabs: TTab[] = [
  { id: 1, name: 'Home', icon: HomeIcon },
  { id: 2, name: 'Discover', icon: CompassIcon },
  { id: 3, name: 'Portfolio', icon: PieChartIcon },
];

const activeTabInitialValue = (pathname: string) => {
  return tabs.find(tab => tab.name.toLowerCase() === pathname.split('/')[1]) || null;
}

const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TTab | null>(activeTabInitialValue(pathname));

  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");

  useEffect(() => {
    setActiveTab(activeTabInitialValue(pathname));
  }, [pathname]);

  const handleTabClick = (tab: TTab) => {
    setActiveTab(tab);
    router.push(`/${tab.name.toLowerCase()}`);
  };

  const BUTTON_DEFAULT_STYLES = "group self-stretch px-6 max-lg:px-5 rounded-[14px] uppercase hover:text-primary";
  const BUTTON_INACTIVE_STYLES = `${BUTTON_DEFAULT_STYLES} opacity-50 hover:opacity-100`;
  const BUTTON_ACTIVE_STYLES = `${BUTTON_DEFAULT_STYLES}`;

  function isSelected(tab: TTab) {
    return tab.id === activeTab?.id;
  }

  return (
    <header
      // initial={{ y: -100 }}
      // animate={{ y: 0 }}
      // transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
      className="z-50 sticky top-5 left-0 flex overflow-hidden gap-5 max-lg:gap-10 justify-between items-center self-stretch py-0 pr-[8px] md:pl-[20px] mb-16 lg:mb-20 w-full font-semibold uppercase rounded-xl bg-white bg-opacity-40 backdrop-blur min-h-[56px] shadow-[0px_2px_2px_rgba(0,0,0,0.02)] max-md:max-w-full max-w-[1200px] mx-auto">
      <Button variant="ghost" onClick={() => router.push('home')}>
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/071c90e2379bd33d3fbab4abc909fb5465bb038028349549391b7c9b806ed865?placeholderIfAbsent=true&apiKey=689e79da645a41c0a4332461eb09084b"
          alt="Superlend logo"
          className="object-contain shrink-0 self-stretch my-auto w-36 aspect-[6.54] cursor-pointer"
        />
      </Button>
      <nav className="hidden md:flex lg:gap-5 items-center self-stretch my-auto text-sm tracking-normal leading-none whitespace-nowrap min-w-[240px] text-stone-800 max-md:max-w-full">
        {tabs.map((tab) => (
          <Button key={tab.id} variant={isSelected(tab) ? "default" : "ghost"} size="lg" className={`${isSelected(tab) ? BUTTON_ACTIVE_STYLES : BUTTON_INACTIVE_STYLES}`} onClick={() => handleTabClick(tab)}>
            <div className="flex items-center justify-center gap-2">
              <tab.icon />
              <span>{tab.name}</span>
            </div>
          </Button>
        ))}
      </nav>
      <Button variant="primary" size={isSmallDevice ? "md" : "lg"} className="rounded-[12px] py-2">Connect wallet</Button>
    </header>
  );
};

export default Header;