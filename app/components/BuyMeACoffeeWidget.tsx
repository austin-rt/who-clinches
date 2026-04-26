'use client';

import { useEffect } from 'react';

const BuyMeACoffeeWidget = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    const script = document.createElement('script');
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
    script.setAttribute('data-id', 'xWk6jcTZTU');
    script.setAttribute('data-description', 'Support me on Buy me a coffee!');
    script.setAttribute('data-message', '');
    script.setAttribute('data-color', '#FFDD00');
    script.setAttribute('data-position', 'left');
    script.setAttribute('data-x_margin', '18');
    script.setAttribute('data-y_margin', '18');
    script.async = true;

    script.onload = function () {
      const evt = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
      window.dispatchEvent(evt);
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      const widget = document.getElementById('bmc-wbtn');
      if (widget?.parentNode) widget.parentNode.removeChild(widget);
    };
  }, []);

  return null;
};

export default BuyMeACoffeeWidget;
