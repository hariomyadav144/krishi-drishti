import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Printer, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { FASAL_DRISHTI_URL, FASAL_DRISHTI_QR_DATA_URL } from '../utils/qrCodeAsset';

export { FASAL_DRISHTI_URL, FASAL_DRISHTI_QR_DATA_URL };

export default function ShareFasalDrishti({ variant = 'dark', className = '' }) {
  const { lang, t } = useLanguage();
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shared, setShared] = useState(false);
  const [qrReady, setQrReady] = useState(false);

  // Generate QR code on canvas
  useEffect(() => {
    let isMounted = true;
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        FASAL_DRISHTI_URL,
        {
          width: 256,
          margin: 2,
          errorCorrectionLevel: 'H', // High (30% recovery capacity) — highest durability for print & camera scanning
          color: {
            dark: '#0e2a18', // Deep organic green
            light: '#ffffff'
          }
        },
        (error) => {
          if (!error && isMounted) {
            setQrReady(true);
          }
        }
      );
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Download high-resolution print-ready PNG (1200 x 1200 px at 300 DPI quality)
  const handleDownload = async () => {
    try {
      setDownloading(true);
      // Create high-res offscreen canvas
      const highResCanvas = document.createElement('canvas');
      await QRCode.toCanvas(highResCanvas, FASAL_DRISHTI_URL, {
        width: 1200,
        margin: 3,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#0e2a18',
          light: '#ffffff'
        }
      });

      const dataUrl = highResCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'fasal-drishti-qr-code.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => setDownloading(false), 800);
    } catch (err) {
      console.error('Failed to generate high-res QR download:', err);
      // Fallback to static public image
      const link = document.createElement('a');
      link.href = './fasal-drishti-qr.png';
      link.download = 'fasal-drishti-qr-code.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloading(false);
    }
  };

  // Copy website link to clipboard
  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(FASAL_DRISHTI_URL);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = FASAL_DRISHTI_URL;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Copy link failed:', err);
    }
  };

  // Native Web Share API with fallback to copy
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fasal Drishti (फ़सल दृष्टि) - Smart Agriculture Platform',
          text: lang === 'hi' 
            ? 'स्मार्ट कृषि, उपग्रह खेत निगरानी, एआई रोग निदान और ताजा मंडी भाव के लिए फ़सल दृष्टि देखें:'
            : 'Access smart satellite farm monitoring, AI crop disease diagnostics, and APMC mandi rates on Fasal Drishti:',
          url: FASAL_DRISHTI_URL,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const isDark = variant === 'dark';

  return (
    <section 
      id="share-fasal-drishti" 
      aria-label="Share Fasal Drishti QR Code"
      className={`rounded-3xl transition-all duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900/80 to-[#0e2a18]/90 border border-emerald-500/30 text-white backdrop-blur-md shadow-2xl p-6 sm:p-8' 
          : 'bg-white border border-emerald-100 text-slate-800 shadow-lg p-6 sm:p-8'
      } ${className}`}
    >
      <div className="max-w-4xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide mb-2.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{lang === 'hi' ? 'स्मार्ट कृषि शेयरिंग' : 'Instant Web Access'}</span>
          </div>

          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {lang === 'hi' ? 'फ़सल दृष्टि साझा करें (Share Fasal Drishti)' : 'Share Fasal Drishti'}
          </h2>

          <p className={`mt-2 text-sm sm:text-base max-w-xl mx-auto ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {t('share.description', 'Scan this QR code to access our smart agriculture platform.')}
          </p>
        </div>

        {/* QR Code Presentation Box & Action Options */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-2">
          
          {/* Real Scannable QR Code Canvas Box */}
          <div className="flex flex-col items-center">
            <div className="relative group p-4 rounded-3xl bg-white shadow-2xl border-4 border-emerald-500/30 transition-transform duration-300 hover:scale-102">
              
              {/* Corner Guide Accents */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-600 rounded-tl-lg pointer-events-none" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-600 rounded-tr-lg pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-600 rounded-bl-lg pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-600 rounded-br-lg pointer-events-none" />

              {/* Actual Visible Scannable QR Code Image */}
              <img
                src={FASAL_DRISHTI_QR_DATA_URL}
                alt="Scan to Visit Fasal Drishti QR Code"
                className="w-52 h-52 sm:w-60 sm:h-60 rounded-xl object-contain mx-auto block shadow-xs"
                loading="eager"
              />

              {/* Offscreen canvas for custom rendering */}
              <canvas
                ref={canvasRef}
                className="hidden"
                aria-hidden="true"
              />
            </div>

            {/* Prompt under QR Code */}
            <div className="mt-3.5 text-center">
              <span className={`inline-flex items-center gap-1.5 text-sm font-black tracking-wide ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                <Smartphone className="w-4 h-4 text-emerald-400" />
                {t('share.scanToVisit', 'Scan to Visit Fasal Drishti')}
              </span>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {lang === 'hi' 
                  ? 'किसी भी फोन के कैमरे या गूगल लेंस से स्कैन करें' 
                  : 'Works with any smartphone camera, Google Lens or QR scanner'}
              </p>
            </div>
          </div>

          {/* Action Options & Features */}
          <div className="flex flex-col justify-center max-w-md w-full space-y-4">
            
            {/* Direct URL Display & Quick Copy Pill */}
            <div className={`p-3.5 rounded-2xl border transition ${
              isDark ? 'bg-black/30 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {lang === 'hi' ? 'वेबसाइट लिंक (Official URL):' : 'Official Website URL:'}
                </span>
                <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  HTTPS Verified
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={FASAL_DRISHTI_URL}
                  className={`flex-1 text-xs font-mono px-3 py-2 rounded-xl outline-none truncate border ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-emerald-300' 
                      : 'bg-white border-slate-200 text-emerald-700'
                  }`}
                  aria-label="Website Link URL"
                />
                <button
                  type="button"
                  id="btn-copy-url-inline"
                  onClick={handleCopy}
                  title="Copy Link"
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? (lang === 'hi' ? 'कॉपी हुआ!' : 'Copied!') : (lang === 'hi' ? 'कॉपी' : 'Copy')}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons: Download, Share, Copy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* 1. Download High-Quality PNG Button */}
              <button
                type="button"
                id="btn-download-qr-code"
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 active:scale-97 transition cursor-pointer border border-emerald-400/30"
              >
                <Download className="w-4 h-4" />
                <span>{downloading 
                  ? (lang === 'hi' ? 'डाउनलोड हो रहा है...' : 'Downloading...') 
                  : (lang === 'hi' ? 'QR कोड डाउनलोड करें' : 'Download QR Code')}
                </span>
              </button>

              {/* 2. Share Website via Web Share API Button */}
              <button
                type="button"
                id="btn-share-website"
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-900/30 active:scale-97 transition cursor-pointer border border-teal-400/30"
              >
                <Share2 className="w-4 h-4" />
                <span>{shared 
                  ? (lang === 'hi' ? 'साझा किया गया!' : 'Shared!') 
                  : (lang === 'hi' ? 'वेबसाइट साझा करें' : 'Share Website')}
                </span>
              </button>

              {/* 3. Copy Website Link Button (Full Width fallback & direct action) */}
              <button
                type="button"
                id="btn-copy-website-link"
                onClick={handleCopy}
                className={`col-span-1 sm:col-span-2 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer border ${
                  isDark 
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>
                  {copied 
                    ? (lang === 'hi' ? '✓ लिंक कॉपी हो गया' : '✓ Website Link Copied to Clipboard') 
                    : (lang === 'hi' ? 'वेबसाइट लिंक कॉपी करें (Copy Website Link)' : 'Copy Website Link')}
                </span>
              </button>

              {/* 4. Open Website Directly in New Tab */}
              <a
                href={FASAL_DRISHTI_URL}
                target="_blank"
                rel="noreferrer"
                id="link-open-fasal-drishti"
                className={`col-span-1 sm:col-span-2 flex items-center justify-center gap-1.5 py-2 px-3 text-2xs font-semibold text-center transition ${
                  isDark ? 'text-emerald-400/90 hover:text-emerald-300' : 'text-emerald-700 hover:text-emerald-800'
                }`}
              >
                <span>{lang === 'hi' ? 'ब्राउज़र में सीधे खोलें' : 'Open Website Directly'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Quality & Print Guarantee Info Pill */}
            <div className={`p-3 rounded-2xl flex items-center gap-3 text-xs border ${
              isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-emerald-50/60 border-emerald-200 text-slate-700'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div className="leading-snug">
                <p className="font-bold text-2xs uppercase tracking-wider text-emerald-400">
                  {lang === 'hi' ? 'प्रिंट और प्रचार हेतु उत्तम' : 'Print & Poster Ready'}
                </p>
                <p className="text-[11px] text-slate-300">
                  {lang === 'hi'
                    ? 'हाई-डेफिनिशन PNG (1200px, Level-H). A4 पोस्टर, बैनर, विज़िटिंग कार्ड एवं प्रस्तुतियों में 100% स्पष्ट रहता है।'
                    : '1200px Level-H PNG remains crystal clear & scannable when printed on A4 paper, posters, banners, and visiting cards.'}
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
