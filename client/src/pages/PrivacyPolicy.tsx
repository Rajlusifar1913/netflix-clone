import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const SECTIONS = [
  {
    title: "Information We Collect",
    content: "We collect information you provide directly to us, such as when you create an account, subscribe to a plan, or contact us for support. This may include your name, email address, payment information, and viewing preferences."
  },
  {
    title: "How We Use Your Information",
    content: "We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and personalize your content experience based on your viewing history."
  },
  {
    title: "Information Sharing",
    content: "We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our platform, conducting our business, or servicing you, so long as those parties agree to keep this information confidential."
  },
  {
    title: "Data Security",
    content: "We implement a variety of security measures to maintain the safety of your personal information. All data is encrypted using industry-standard SSL/TLS protocols. Payment information is processed through secure, PCI-compliant payment processors."
  },
  {
    title: "Cookies and Tracking",
    content: "Streamly uses cookies to enhance your browsing experience, analyze site traffic, and understand user behavior. You can control cookie settings through your browser. Note that disabling cookies may affect certain features of our service."
  },
  {
    title: "Your Rights",
    content: "You have the right to access, correct, or delete your personal data at any time. You may also request data portability or object to processing. To exercise these rights, contact us through the Help Center or your Account settings."
  },
  {
    title: "Contact Us",
    content: "If you have any questions about this Privacy Policy, please contact our Privacy Team at privacy@streamly.com or through the Help Center. We aim to respond to all inquiries within 48 hours."
  }
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <Link to="/browse" className="mb-10 flex items-center gap-2 text-sm text-[#aaa] transition hover:text-white">
          <ArrowLeft className="size-4" />
          Back to Browse
        </Link>

        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e50914] mb-2">Legal</p>
          <h1 className="text-4xl font-black tracking-tight">Privacy Policy</h1>
          <p className="mt-3 text-sm text-[#888]">Last updated: January 1, 2026</p>
          <div className="mt-4 h-px bg-gradient-to-r from-[#e50914]/50 to-transparent" />
        </div>

        <p className="text-sm text-[#bbb] leading-7 mb-10">
          At Streamly, we are committed to protecting your privacy and ensuring you have a positive experience on our platform. This policy outlines how we collect, use, and protect your information.
        </p>

        <div className="flex flex-col gap-8">
          {SECTIONS.map((section, i) => (
            <section key={i} className="rounded-xl border border-white/8 bg-[#1a1a1a]/60 p-6">
              <h2 className="mb-3 text-base font-bold text-white">{section.title}</h2>
              <p className="text-sm text-[#aaa] leading-7">{section.content}</p>
            </section>
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-[#555]">
          © 2026 Streamly Entertainment. All rights reserved.
        </p>
      </div>
    </main>
  );
}
