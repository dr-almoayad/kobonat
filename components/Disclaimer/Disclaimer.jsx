import React from 'react';
import './Disclaimer.css';

const Disclaimer = ({ locale = 'en' }) => {
  const isArabic = locale?.startsWith('ar');
  const dir = isArabic ? 'rtl' : 'ltr';

  const content = {
    en: {
      title: "Important Disclaimer",
      affiliate: "Disclosure: This site contains affiliate links. We may earn a commission on qualifying purchases.",
      accuracy: "Disclaimer: All offers are subject to the merchant's terms and conditions and availability.",
    },
    ar: {
      title: "تنويه هام",
      affiliate: "إفصاح: يحتوي هذا الموقع على روابط ترويجية. قد نحصل على عمولة عند إتمام عمليات الشراء المؤهلة.",
      accuracy: "إخلاء مسؤولية: جميع العروض تخضع للشروط والأحكام الخاصة بالمتجر وتوافر المنتجات.",
    }
  };

  const text = isArabic ? content.ar : content.en;

  return (
    <div className="site-disclaimer" dir={dir}>
      <div className="disclaimer-container">
        <div className="disclaimer-icon">
          {/* Using Material Symbol 'info' or a simple SVG fallback */}
          <span className="material-symbols-sharp">info</span>
        </div>
        
        <div className="disclaimer-text">
          <p className="disclaimer-p">
            <strong>{text.affiliate.split(':')[0]}:</strong> 
            {text.affiliate.split(':')[1]}
          </p>
          <p className="disclaimer-p">
            <strong>{text.accuracy.split(':')[0]}:</strong> 
            {text.accuracy.split(':')[1]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
