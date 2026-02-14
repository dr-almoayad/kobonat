import React from 'react';
import './HelpBox.css';
import Link from 'next/link';

const HelpBox = ({ locale = 'en' }) => {
  // Check if locale is a full string like 'ar-EG' or just 'ar'
  const isArabic = typeof locale === 'string' && locale.startsWith('ar');
  const dir = isArabic ? 'rtl' : 'ltr';

  const content = {
    en: {
      title: "Need Help?",
      description: "Can't find what you're looking for? Our help center has answers to common questions about coupons, deals, and more.",
      button: "Visit Help Center",
      link: "/help"
    },
    ar: {
      title: "هل تحتاج إلى مساعدة؟",
      description: "لم تجد ما تبحث عنه؟ يحتوي مركز المساعدة لدينا على إجابات للأسئلة الشائعة حول الكوبونات والعروض والمزيد.",
      button: "زيارة مركز المساعدة",
      link: "/help"
    }
  };

  const text = isArabic ? content.ar : content.en;

  return (
    <div className="site-help-box" dir={dir}>
      <div className="help-box-container">
        <div className="help-box-icon">
          <span className="material-symbols-sharp">help</span>
        </div>
        
        <div className="help-box-content">
          <h4 className="help-box-title">{text.title}</h4>
          <p className="help-box-description">{text.description}</p>
        </div>

        <div className="help-box-actions">
          <Link 
            href={`/${locale}${text.link}`}
            className="help-box-button"
          >
            {text.button}
            <span className="material-symbols-sharp">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HelpBox;
