import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  ["What is Streamly?", "Streamly is a streaming experience for discovering award-winning series, films, documentaries, and more across all your devices."],
  ["How much does Streamly cost?", "Watch Streamly on your phone, tablet, laptop, and TV. Plans are flexible, with no contracts or hidden fees."],
  ["Where can I watch?", "Watch anywhere, anytime. Sign in on the web or use your favorite internet-connected device."],
  ["How do I cancel?", "Streamly is flexible. There are no contracts or commitments, and you can manage your plan online whenever you like."],
  ["What can I watch on Streamly?", "Our library includes feature films, acclaimed series, documentaries, family favorites, and new discoveries."],
  ["Is Streamly good for kids?", "Kids profiles give families a dedicated space with age-appropriate shows and simple parental controls."],
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto mt-8 max-w-5xl space-y-2">
      {faqs.map(([question, answer], index) => (
        <div key={question} className="overflow-hidden bg-[#2d2d2d]">
          <button onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index} className="flex w-full items-center justify-between p-5 text-left text-lg font-medium hover:bg-[#414141] sm:p-6 sm:text-2xl">
            {question}<ChevronDown className={cn("size-7 shrink-0 transition-transform duration-300", open === index && "rotate-180")} />
          </button>
          <div className={cn("grid transition-[grid-template-rows] duration-300", open === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <div className="overflow-hidden"><p className="border-t border-black/70 p-5 text-base leading-relaxed text-[#e5e5e5] sm:p-6 sm:text-xl">{answer}</p></div>
          </div>
        </div>
      ))}
    </div>
  );
}
