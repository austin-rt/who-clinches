import Script from 'next/script';

const HotjarInit = () => {
  return (
    <Script src="https://t.contentsquare.net/uxa/f80d849c7db5f.js" strategy="afterInteractive" />
  );
};

export default HotjarInit;
