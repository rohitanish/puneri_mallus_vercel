"use client";
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Instagram, Facebook, MessageCircle, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) return null;

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Events', href: '/events' },
    { name: 'Community', href: '/community' },
    { name: 'Partners', href: '/partners' },
    { name: 'Contact', href: '/contact' },
  ];

  const socials = [
    { icon: Instagram, href: 'https://instagram.com/puneri_mallus', label: 'Instagram' },
    { icon: Facebook, href: 'https://facebook.com/punerimallus', label: 'Facebook' },
    { icon: MessageCircle, href: 'https://chat.whatsapp.com/JUmbCVtCCZE27JAXsYw0bU?mode=gi_t', label: 'WhatsApp' },
  ];

  return (
    /* FIXED: Changed gradient to solid black and added high z-index */
    <footer className="relative z-50 bg-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-10">

        {/* TOP ROW — Logo + Tagline left, Nav right */}
        <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-8 pb-12">

          {/* Logo + tagline */}
          <div className="flex flex-col gap-5">
            <Link href="/" className="inline-block group">
              <div className="relative h-48 w-[540px]">
                <Image
                  src="/logo.png"
                  alt="Puneri Mallus"
                  fill
                  className="object-contain object-left transition-all duration-500 group-hover:drop-shadow-[0_0_40px_rgba(255,0,0,0.5)]"
                  priority
                />
              </div>
            </Link>
            <p className="text-zinc-500 text-[11px] font-medium uppercase tracking-[0.4em] leading-relaxed max-w-[280px]">
              Kerala's Heart.<br />
              <span className="text-brandRed">Pune's Soul.</span>
            </p>
          </div>

          {/* Nav links */}
          <nav className="grid grid-cols-2 sm:grid-cols-3 md:flex md:items-start gap-x-10 gap-y-4 md:pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[12px] font-semibold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors duration-200 whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* BOTTOM ROW */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-6 border-t border-white/5">

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-600">
              © 2026 Puneri Mallus Hub
            </span>
            <span className="text-[12px] uppercase tracking-[0.3em] text-white">
  Built by Rohit Anish
</span>
          </div>

          <div className="flex items-center gap-8">
            {/* Social icons */}
            <div className="flex items-center gap-5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="text-zinc-500 hover:text-white transition-all duration-200 hover:scale-110"
                >
                  <s.icon size={26} />
                </a>
              ))}
            </div>

            {/* Legal links */}
            <div className="flex items-center gap-5">
              <Link href="/privacy" className="text-[10px] uppercase tracking-[0.25em] text-zinc-600 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-[10px] uppercase tracking-[0.25em] text-zinc-600 hover:text-white transition-colors">
                Terms
              </Link>
            </div>

            {/* Back to top */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-zinc-600 hover:text-white transition-colors group"
            >
              Top
              <ArrowUpRight size={12} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}