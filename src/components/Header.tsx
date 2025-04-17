'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Globe, Github, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.8 }}>
              {/* <Globe className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors" /> */}
                <Image src='/viatorai_color_logo.png' height={24} width={24} alt='Viator AI Logo'/>
              </motion.div>
              <span className="font-semibold text-xl text-indigo-700 dark:text-indigo-300">ViatorAI</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#"
              className="text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors"
            >
              Home
            </a>
            <a
              href="#"
              className="text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors"
            >
              Explore
            </a>
            <a
              href="#"
              className="text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors"
            >
              Weather
            </a>
            <a
              href="#"
              className="text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors"
            >
              Contact
            </a>
            <Link
              href="https://github.com/pparthiv/ViatorAI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors"
            >
              <Github className="h-5 w-5" />
            </Link>
          </nav>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-indigo-700 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
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
                className="text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors py-2"
              >
                Home
              </a>
              <a
                href="#"
                className="text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors py-2"
              >
                Explore
              </a>
              <a
                href="#"
                className="text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors py-2"
              >
                Weather
              </a>
              <a
                href="#"
                className="text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors py-2"
              >
                Contact
              </a>
              <Link
                href="https://github.com/pparthiv/ViatorAI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
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