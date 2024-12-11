'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FeedbackFormDialog } from './feedback-form-dialog';
import { BodyText, HeadingText } from './ui/typography';
import { MessageSquare, MessageSquareText } from 'lucide-react';

export function FeedbackBanner() {
  return (
    <Card className="w-full">
      <CardContent className="relative p-8 max-md:pt-[40px] max-md:pl-[50px] md:pl-[60px] overflow-hidden">
        <div className="absolute -top-[60px] -left-[60px] bg-white bg-opacity-90 w-[120px] h-[120px] rounded-full flex items-end justify-end">
          <MessageSquareText className="h-5 w-5 text-primary absolute right-6 bottom-[1.5rem]" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <HeadingText level="h3" weight="medium" className="text-2xl font-bold text-gray-800">
                Help Us Innovate in DeFi
              </HeadingText>
              {/* <BodyText level="body2" className="text-gray-800  max-w-[600px]">
                Would a cross-chain yield optimizer be valuable to you?
              </BodyText> */}
            </div>
            <div className="content-body flex flex-col gap-1">
              <BodyText level="body2" weight="normal" className="max-w-[600px] text-gray-600">
                Did we miss your favorite token or chain?
              </BodyText>
              <BodyText level="body2" weight="normal" className="max-w-[600px] text-gray-600">
                What other features would you love to see here?
              </BodyText>
            </div>
          </div>
          <div className="max-md:w-full">
            <FeedbackFormDialog />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
