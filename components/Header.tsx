'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { usePathname, useRouter } from 'next/navigation';
import HomeIcon from './icons/home-icon';
import CompassIcon from './icons/compass-icon';
import PieChartIcon from './icons/pie-chart-icon';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu, X } from 'lucide-react';
import { motion } from "framer-motion"


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
  const [openMenu, setOpenMenu] = useState(false);

  useEffect(() => {
    setActiveTab(activeTabInitialValue(pathname));
  }, [pathname]);

  const handleTabClick = (tab: TTab) => {
    setActiveTab(tab);
    setOpenMenu(false);
    router.push(`/${tab.name.toLowerCase()}`);
  };

  const BUTTON_DEFAULT_DESKTOP_STYLES = "group self-stretch px-6 max-lg:px-5 rounded-[14px] uppercase hover:text-primary";
  const BUTTON_INACTIVE_DESKTOP_STYLES = `${BUTTON_DEFAULT_DESKTOP_STYLES} opacity-50 hover:opacity-100`;
  const BUTTON_ACTIVE_DESKTOP_STYLES = `${BUTTON_DEFAULT_DESKTOP_STYLES}`;

  const BUTTON_DEFAULT_MOBILE_STYLES = "group self-stretch border-0";
  const BUTTON_INACTIVE_MOBILE_STYLES = `${BUTTON_DEFAULT_MOBILE_STYLES} opacity-50 hover:opacity-100`;
  const BUTTON_ACTIVE_MOBILE_STYLES = `${BUTTON_DEFAULT_MOBILE_STYLES} text-primary selected`;

  function isSelected(tab: TTab) {
    return tab.id === activeTab?.id;
  }

  function handleCloseMenu() {
    setOpenMenu(false);
  }

  const menuContainerVariant = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  }

  const menuItemVariant = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  }

  return (
    <header
      // initial={{ y: -100 }}
      // animate={{ y: 0 }}
      // transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
      className="z-50 sticky top-5 left-0 flex overflow-hidden gap-5 max-lg:gap-10 justify-between items-center self-stretch py-0 pr-[8px] pl-4 sm:pl-[20px] mb-16 lg:mb-20 w-full font-semibold uppercase rounded-xl bg-white bg-opacity-40 backdrop-blur min-h-[56px] shadow-[0px_2px_2px_rgba(0,0,0,0.02)] max-md:max-w-full max-w-[1200px] mx-auto">
      <Button variant="ghost" className='w-[24px] md:w-fit p-0' onClick={() => router.push('home')}>
        <img
          loading="lazy"
          src={"/images/logos/favicon-32x32.png"}
          alt="Superlend logo"
          className="md:hidden object-contain shrink-0 my-auto w-[1.5rem] aspect-square cursor-pointer"
        />
        <img
          loading="lazy"
          src={"/images/logos/superlend-logo.webp"}
          alt="Superlend logo"
          className="hidden md:inline object-contain shrink-0 my-auto aspect-[6.54] w-36 cursor-pointer"
        />
      </Button>
      <nav className="hidden md:flex lg:gap-5 items-center self-stretch my-auto text-sm tracking-normal leading-none whitespace-nowrap min-w-[240px] text-stone-800 max-md:max-w-full">
        {tabs.map((tab) => (
          <Button key={tab.id} variant={isSelected(tab) ? "default" : "ghost"} size="lg" className={`${isSelected(tab) ? BUTTON_ACTIVE_DESKTOP_STYLES : BUTTON_INACTIVE_DESKTOP_STYLES}`} onClick={() => handleTabClick(tab)}>
            <div className="flex items-center justify-center gap-2">
              <tab.icon />
              <span>{tab.name}</span>
            </div>
          </Button>
        ))}
      </nav>
      <div className="flex items-center gap-[12px]">
        <Button variant="primary" size={"lg"} className="rounded-[12px] py-2">Connect wallet</Button>
        <Button variant="outline" size={"md"} className="hidden max-md:block rounded-[12px] py-2 border border-gray-500 py-[6px]" onClick={() => setOpenMenu(true)}>
          <Menu className='text-gray-600'/>
        </Button>
      </div>

      <Sheet open={openMenu}>
        <SheetContent side="top" className='h-full'>
          <Button onClick={handleCloseMenu} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary border-none p-0">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
          <SheetHeader className='pt-8'>
            <motion.ul
              variants={menuContainerVariant}
              initial="hidden"
              animate="show"
              className='flex flex-col gap-[15px]'>
              {tabs.map((tab) => (
                <motion.li variants={menuItemVariant}>
                  <Button key={tab.id} variant={isSelected(tab) ? "default" : "ghost"} size="lg" className={`${isSelected(tab) ? BUTTON_ACTIVE_MOBILE_STYLES : BUTTON_INACTIVE_MOBILE_STYLES}`} onClick={() => handleTabClick(tab)}>
                    <div className="flex items-center justify-center gap-2">
                      <tab.icon />
                      <span>{tab.name}</span>
                    </div>
                  </Button>
                </motion.li>
              ))}
            </motion.ul>
          </SheetHeader>
        </SheetContent>
      </Sheet>

    </header>
  );
};

export default Header;