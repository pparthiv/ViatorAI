'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Globe, Github, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8 }}
            >
              <Globe className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors" />
            </motion.div>
            <span className="font-semibold text-xl text-slate-900 dark:text-white">ViatorAI</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#"
            className="text-sm font-medium text-slate-700 hover:text-primary dark:text-slate-200 dark:hover:text-primary transition-colors"
          >
            Home
          </a>
          <a
            href="#"
            className="text-sm font-medium text-slate-700 hover:text-primary dark:text-slate-200 dark:hover:text-primary transition-colors"
          >
            Explore
          </a>
          <a
            href="#"
            className="text-sm font-medium text-slate-700 hover:text-primary dark:text-slate-200 dark:hover:text-primary transition-colors"
          >
            Weather
          </a>
          <a
            href="#"
            className="text-sm font-medium text-slate-700 hover:text-primary dark:text-slate-200 dark:hover:text-primary transition-colors"
          >
            Contact
          </a>
          <Link
            href="https://github.com/pparthiv/ViatorAI"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-700 hover:text-primary dark:text-slate-200 dark:hover:text-primary transition-colors"
          >
            <Github className="h-5 w-5" />
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-slate-700 dark:text-slate-200 hover:text-primary dark:hover:text-primary transition-colors"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <a
              href="#"
              className="text-sm font-medium text-slate-700 hover:text-primary dark:text-slate-200 dark:hover:text-primary transition-colors py-2"
            >
              Home
            </a>
            <a
              href="#"
              className="text-sm font-medium text-slate-700 hover:text-primary dark:text-slate-200 dark:hover:text-primary transition-colors py-2"
            >
              Explore
            </a>
            <a
              href="#"
              className="text-sm font-medium text-slate-700 hover:text-primary dark:text-slate-200 dark:hover:text-primary transition-colors py-2"
            >
              Weather
            </a>
            <a
              href="#"
              className="text-sm font-medium text-slate-700 hover:text-primary dark:text-slate-200 dark:hover:text-primary transition-colors py-2"
            >
              Contact
            </a>
            <Link
              href="https://github.com/pparthiv/ViatorAI"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-primary dark:text-slate-200 dark:hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Github className="h-5 w-5" />
              <span>GitHub</span>
            </Link>
          </div>
        </motion.div>
      )}
    </header>
  );
}