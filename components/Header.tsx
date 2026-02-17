'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const navLinks = [
  { name: 'About', href: '/about' },
  { name: 'Experience', href: '/experience' },
  { name: 'Research', href: '/research' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="container mx-auto flex justify-between">
        <Link href="/" className="text-2xl font-bold">
          My Portfolio
        </Link>
        <ul className="flex items-center space-x-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={`relative ${
                    isActive ? 'text-blue-400' : 'text-white'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-0.5 bg-blue-400 w-full"
                      layoutId="underline"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
