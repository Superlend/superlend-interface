'use client';
import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

interface TokenRate {
  image: string;
  rate: string;
}

const tokenRates: TokenRate[] = [
  {
    image:
      'https://cdn.builder.io/api/v1/image/assets/TEMP/5fea263a5aea859fa1693accb8dab66a3c880004d4547bdd47ca1fa586abcadd?placeholderIfAbsent=true&apiKey=689e79da645a41c0a4332461eb09084b',
    rate: '11.24%',
  },
  {
    image:
      'https://cdn.builder.io/api/v1/image/assets/TEMP/ccf389de1dfcd60e0f75dabaaa9ef364e519a85bf06715d570c442346f7e79d3?placeholderIfAbsent=true&apiKey=689e79da645a41c0a4332461eb09084b',
    rate: '11.24%',
  },
  {
    image:
      'https://cdn.builder.io/api/v1/image/assets/TEMP/3efd819bdc0301d3e89e6d3256b47639aea9ddc69185c211c00bcf135f861d45?placeholderIfAbsent=true&apiKey=689e79da645a41c0a4332461eb09084b',
    rate: '16.32%',
  },
  {
    image:
      'https://cdn.builder.io/api/v1/image/assets/TEMP/5fea263a5aea859fa1693accb8dab66a3c880004d4547bdd47ca1fa586abcadd?placeholderIfAbsent=true&apiKey=689e79da645a41c0a4332461eb09084b',
    rate: '16.32%',
  },
  {
    image:
      'https://cdn.builder.io/api/v1/image/assets/TEMP/11bc6e56c2b450068a8734c472569dc37e1d5bb1aee4d5fe467062402678be87?placeholderIfAbsent=true&apiKey=689e79da645a41c0a4332461eb09084b',
    rate: '10.48%',
  },
  {
    image:
      'https://cdn.builder.io/api/v1/image/assets/TEMP/b67c3f362eafed7a9a868b82b9ab3c0841f57ecbedf58457074262554393c8ce?placeholderIfAbsent=true&apiKey=689e79da645a41c0a4332461eb09084b',
    rate: '12.32%',
  },
  {
    image:
      'https://cdn.builder.io/api/v1/image/assets/TEMP/5fea263a5aea859fa1693accb8dab66a3c880004d4547bdd47ca1fa586abcadd?placeholderIfAbsent=true&apiKey=689e79da645a41c0a4332461eb09084b',
    rate: '16.32%',
  },
];

const TokenRates: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-6 items-center justify-center max-w-full overflow-hidden mt-9 max-w-3xl text-sm font-medium leading-tight whitespace-nowrap text-stone-800 w-[817px] [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
      <Carousel
        opts={{
          align: 'center',
          loop: true,
        }}
      >
        <CarouselContent>
          {tokenRates.map((token, index) => (
            <CarouselItem key={index} className="basis-auto">
              <div className="flex gap-2 items-center self-stretch py-1 pr-2 pl-1 my-auto bg-white rounded-xl select-none">
                {/* shadow-[0px_2px_4px_rgba(0,0,0,0.44)] */}
                <img
                  loading="lazy"
                  src={token.image}
                  alt="Token icon"
                  className="object-contain shrink-0 self-stretch my-auto rounded-full aspect-square w-[26px]"
                />
                <div className="self-stretch my-auto">{token.rate}</div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default TokenRates;
