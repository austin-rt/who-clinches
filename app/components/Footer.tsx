'use client';

import Link from 'next/link';
import BuyMeACoffeeButton from './BuyMeACoffeeButton';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer footer-center mt-auto bg-base-200 p-6 text-base-content">
      <div className="container mx-auto">
        <div className="flex flex-col items-center gap-4">
          <BuyMeACoffeeButton />
          <div className="flex items-center gap-3 text-sm">
            <p>© {currentYear} Who Clinches</p>
            <span className="text-text-secondary">·</span>
            <Link
              href="/contribute"
              className="text-text-secondary transition-colors hover:text-base-content dark:text-white dark:hover:text-base-content"
            >
              Contribute
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
