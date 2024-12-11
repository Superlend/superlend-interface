'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  CircleCheckBig,
  File,
  LoaderCircle,
  MessageSquare,
  MessageSquareCode,
  PaperclipIcon,
  XIcon,
} from 'lucide-react';
import { HeadingText, Label } from './ui/typography';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import useDimensions from '@/hooks/useDimensions';
import axios from 'axios';
import { SHEET_FORM_URL } from '@/constants';
import { DialogClose } from '@radix-ui/react-dialog';

export function FeedbackFormDialog() {
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [attachments, setAttachments] = useState<File[]>([])
  const { width: screenWidth } = useDimensions()
  const isDesktop = useMemo(() => screenWidth > 768, [screenWidth]);
  const isFormEmpty = !feedback.trim().length;

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setFeedback(e.target.value);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prevAttachments) => [
        ...prevAttachments,
        ...Array.from(e.target.files as FileList),
      ]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prevAttachments) => prevAttachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const data = new FormData();
    data.append('email', email.trim());
    data.append('feedback', feedback.trim());
    // attachments.forEach((file, index) => {
    //   data.append(`attachments[${index}]`, file, file.name);
    // });
    try {
      await axios.post(SHEET_FORM_URL, data);
      setIsLoading(false);
      setIsFeedbackSubmitted(true);
      // Reset form after submission
      setEmail('');
      setFeedback('');
      // setAttachments([])
    } catch (error) {
      setIsLoading(false);
      setIsFeedbackSubmitted(false);
      console.log(error);
    }
  };

  function showNewFeedbackForm() {
    return setIsFeedbackSubmitted(false);
  }

  const getFormTemplate = () => {
    return (
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-start gap-2">
            <Label htmlFor="email" className="text-gray-800">
              Email (optional)
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="rounded-4"
              placeholder="example@email.com"
            />
          </div>
          <div className="flex flex-col items-start gap-2">
            <Label htmlFor="feedback" className="text-gray-800">
              Feedback
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={handleFeedbackChange}
              className="rounded-4"
              required
              placeholder="Could be a bug or a feature you would like to see"
            />
          </div>
          {/* <div className="flex flex-col items-start gap-2">
            <Label htmlFor="attachment" className="text-right">
              Attachments (optional)
            </Label>
            <div className="attachment-input-container">
              <Input
                id="attachment"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
              <Label htmlFor="attachment" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm text-gray-600 rounded-4 bg-white p-3">
                  <PaperclipIcon className="h-4 w-4" />
                  Add attachment
                </div>
              </Label>
            </div>
          </div>
          {attachments.length > 0 && (
            <div className="flex flex-col items-start gap-4">
              <ul className="text-sm text-gray-600">
                {attachments.map((file, index) => (
                  <li key={index} className="flex items-center justify-between gap-1">
                    <File className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-800">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttachment(index)}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )} */}
        </div>
        <DialogFooter className="mt-2">
          <div className="grid grid-cols-2 gap-3">
            <DialogClose asChild>
              <Button size={'lg'} variant="secondary" className="w-full">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              size={'lg'}
              variant={'primary'}
              disabled={isLoading || isFormEmpty}
            >
              {isLoading && <LoaderCircle className="text-white w-4 h-4 animate-spin mr-1" />}
              Submit Feedback
            </Button>
          </div>
        </DialogFooter>
      </form>
    );
  };

  if (isDesktop) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="w-full flex items-center justify-center">
            <Button variant="primary" size={'lg'} className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Share Your Thoughts
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white bg-opacity-75 backdrop-blur-sm border-0 rounded-6">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Share Your Thoughts</DialogTitle>
            <DialogDescription className="text-gray-800">
              We appreciate your feedback.{' '}
              {!isFeedbackSubmitted && 'Please fill out the form below.'}
            </DialogDescription>
          </DialogHeader>
          {!isFeedbackSubmitted && <div className="">{getFormTemplate()}</div>}
          {isFeedbackSubmitted && (
            <>
              <div className="flex flex-col items-center justify-center gap-5 py-10">
                <CircleCheckBig className="w-[60px] h-[60px] text-success-text" />
                <HeadingText level="h3">Thank you for your feedback!</HeadingText>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DialogClose asChild>
                  <Button size={'lg'} variant="secondary" className="w-full">
                    Close
                  </Button>
                </DialogClose>
                <Button type="submit" size={'lg'} variant={'primary'} onClick={showNewFeedbackForm}>
                  Give New Feedback
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <div className="w-full flex items-center justify-center">
          <Button variant="primary" size={'lg'} className="flex items-center gap-2 w-full">
            <MessageSquare className="h-5 w-5" />
            Share Your Thoughts
          </Button>
        </div>
      </DrawerTrigger>
      <DrawerContent className="pb-5 px-5 bg-white bg-opacity-75">
        <DrawerHeader>
          <DrawerTitle>Share Your Thoughts</DrawerTitle>
          <DrawerDescription>
            We appreciate your feedback. {!isFeedbackSubmitted && 'Please fill out the form below.'}
          </DrawerDescription>
        </DrawerHeader>
        {!isFeedbackSubmitted && <div className="sm:p-4">{getFormTemplate()}</div>}
        {isFeedbackSubmitted && (
          <>
            <div className="flex flex-col items-center justify-center gap-5 py-10">
              <CircleCheckBig className="w-[60px] h-[60px] text-success-text" />
              <HeadingText level="h3">Thank you for your feedback!</HeadingText>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <DialogClose asChild>
                <Button size={'lg'} variant="secondary" className="w-full">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size={'lg'} variant={'primary'} onClick={showNewFeedbackForm}>
                Give New Feedback
              </Button>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
