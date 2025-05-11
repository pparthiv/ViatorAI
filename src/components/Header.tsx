import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Github, MapPin } from "lucide-react";

interface HeaderProps {
  isMainApp?: boolean;
  onRefreshLocation?: () => void;
}

export default function Header({ isMainApp = false, onRefreshLocation }: HeaderProps) {
  const handleHomeClick = () => {
    if (isMainApp) {
      const confirmed = window.confirm(
        "Returning to the landing page will clear your chat history. Are you sure you want to continue?"
      );
      if (confirmed) {
        window.location.reload();
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={isMainApp ? "#" : "/"} className="flex items-center gap-2 group" onClick={isMainApp ? handleHomeClick : undefined}>
            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.8 }}>
              <Image src="/viatorai_color_logo.png" height={24} width={24} alt="Viator AI Logo" />
            </motion.div>
            <span className="font-semibold text-xl text-indigo-700 dark:text-indigo-300">ViatorAI</span>
          </Link>
        </div>
        <nav className="flex items-center gap-6">
          {isMainApp ? (
            <>
              <Link
                href="#"
                onClick={handleHomeClick}
                className="text-sm font-medium text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors"
              >
                Home
              </Link>
              <Link
                href="https://github.com/pparthiv/ViatorAI"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors"
              >
                <Github className="h-5 w-5" />
              </Link>
              {onRefreshLocation && (
                <button
                  onClick={onRefreshLocation}
                  className="text-indigo-700 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-400 transition-colors"
                >
                  <MapPin className="h-5 w-5" />
                </button>
              )}
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}