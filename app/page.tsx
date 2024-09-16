"use client";

import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { HeadingText } from "@/components/ui/typography";
import { useRouter } from "next/navigation";


export default function Home() {
  const router = useRouter();

  return (
    <>
      <main className="max-w-[1200px] mx-auto">
        <HeadingText level="h1">Index page</HeadingText>
        <div className="mt-10 flex flex-col gap-6">
          <Button size="lg" onClick={() => router.push("/all-components")} className="max-w-xs py-3">View All Components</Button>
        </div>
      </main>
    </>
  );
}
