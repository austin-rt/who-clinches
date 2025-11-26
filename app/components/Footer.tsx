'use client';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer footer-center mt-auto bg-base-300 p-6 text-base-content">
      <div className="container mx-auto">
        <div className="grid grid-flow-col gap-4">
          <div>
            <p className="text-sm">© {currentYear} SEC Tiebreaker Calculator</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
