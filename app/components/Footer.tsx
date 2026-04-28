'use client';

import BuyMeACoffeeButton from './BuyMeACoffeeButton';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer footer-center mt-auto bg-base-200 p-6 text-base-content">
      <div className="container mx-auto">
        <div className="flex flex-col items-center gap-4">
          <BuyMeACoffeeButton />
          <p className="text-sm">© {currentYear} Who Clinches</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
