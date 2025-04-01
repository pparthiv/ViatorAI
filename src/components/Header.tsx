'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, Github, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900/90 via-indigo-900/90 to-blue-900/90 backdrop-blur-md border-b border-indigo-500/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8 }}
                className="p-1 rounded-full bg-indigo-600/50 glow-indigo-500"
              >
                <Globe className="w-8 h-8 text-indigo-300 group-hover:text-indigo-100 transition-colors" />
              </motion.div>
              <span className="text-2xl font-extrabold text-white tracking-tight glow-text drop-shadow-md">
                ViatorAI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="https://github.com/pparthiv/ViatorAI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-indigo-300 transition-colors duration-200 glow-hover"
            >
              <Github className="w-6 h-6" />
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-300 hover:text-indigo-300 transition-colors duration-200"
          >
            {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="md:hidden bg-gradient-to-b from-indigo-900/95 to-blue-900/95 backdrop-blur-md border-b border-indigo-500/20 shadow-lg"
        >
          <div className="px-6 py-4 space-y-4">
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 text-gray-300 hover:text-indigo-300 transition-colors duration-200 glow-hover"
              onClick={() => setIsMenuOpen(false)}
            >
              <Github className="w-6 h-6" />
              <span className="text-lg font-medium">GitHub</span>
            </Link>
          </div>
        </motion.div>
      )}
    </header>
  );
}