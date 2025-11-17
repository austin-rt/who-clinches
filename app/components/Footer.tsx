'use client';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const currentSeason = 2025; // TODO: Get from API or context

  return (
    <footer className="footer footer-center mt-auto bg-base-200 p-6 text-base-content">
      <div className="container mx-auto">
        <div className="grid grid-flow-col gap-4">
          <div>
            <p className="text-sm">© {currentYear} SEC Tiebreaker Calculator</p>
            <p className="text-base-content/70 text-xs">Season {currentSeason}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
