"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { File, MessageSquareCode, PaperclipIcon, XIcon } from "lucide-react"
import { Label } from "./ui/typography"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import useDimensions from "@/hooks/useDimensions"


export function FeedbackFormDialog() {
  const [email, setEmail] = useState("")
  const [feedback, setFeedback] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const { width: screenWidth } = useDimensions()
  const isDesktop = screenWidth > 768;

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)
  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedback(e.target.value)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prevAttachments => [...prevAttachments, ...Array.from(e.target.files as FileList)])
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prevAttachments => prevAttachments.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // console.log({ email, feedback, attachments })
    const data = new FormData();
    data.append('email', email);
    data.append('feedback', feedback);
    attachments.forEach((file, index) => {
      data.append(`attachments[${index}]`, file, file.name);
    });
    try {
      // await fetch(process.env.Sheet_Url as string, {
      //   method: 'POST',
      //   // body: data,
      //   // muteHttpExceptions: true,
      // });

      // Reset form after submission
      setEmail("")
      setFeedback("")
      setAttachments([])
    } catch (error) {
      console.log(error);
    }
  }

  const getFormTemplate = () => {
    return (
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-start gap-2">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="rounded-4"
              required
              placeholder="example@email.com"
            />
          </div>
          <div className="flex flex-col items-start gap-2">
            <Label htmlFor="feedback" className="text-right">
              Feedback
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={handleFeedbackChange}
              className="rounded-4"
              required
              placeholder="Your feedback or suggestions..."
            />
          </div>
          <div className="flex flex-col items-start gap-2">
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
          )}
        </div>
        <DialogFooter className="mt-2">
          <Button type="submit" size={'lg'} variant={'primary'}>Submit Feedback</Button>
        </DialogFooter>
      </form>
    )
  }

  if (isDesktop) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="w-full flex items-center justify-center">
            <Button variant="primary" size={'lg'} className="flex items-center gap-2">
              Give Feedback
              <MessageSquareCode className="h-5 w-5" />
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white bg-opacity-75 backdrop-blur-sm border-0 rounded-6">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Feedback Form</DialogTitle>
            <DialogDescription className="text-gray-600">
              We appreciate your feedback. Please fill out the form below.
            </DialogDescription>
          </DialogHeader>
          {getFormTemplate()}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <div className="w-full flex items-center justify-center">
          <Button variant="primary" size={'lg'} className="flex items-center gap-2">
            Give Feedback
            <MessageSquareCode className="h-5 w-5" />
          </Button>
        </div>
      </DrawerTrigger>
      <DrawerContent className="pb-5 bg-white bg-opacity-75">
        <DrawerHeader>
          <DrawerTitle>Feedback Form</DrawerTitle>
          <DrawerDescription>We appreciate your feedback. Please fill out the form below.</DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          {getFormTemplate()}
        </div>
      </DrawerContent>
    </Drawer>

  )
}