import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import VoiceReader from '../components/VoiceReader';
import FeedbackModal from '../components/FeedbackModal';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Leaf, 
  Calendar, 
  Clock, 
  FileText,
  RefreshCw,
  ArrowRight,
  Info,
  Share2,
  Download,
  Video,
  VideoOff,
  SwitchCamera,
  Zap,
  Printer,
  X
} from 'lucide-react';

export default function ScanCrop({ setActiveTab }) {
  const { lang, t } = useLanguage();
  const { currentCrop } = useAuth();

  const [symptomDescription, setSymptomDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [sampleUrl, setSampleUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');

  // Live Camera streaming states
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [flashActive, setFlashActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const fileInputRef = useRef(null);

  // Clear previous analysis immediately when language changes to guarantee fresh, unmixed output
  useEffect(() => {
    setAnalysisResult(null);
    setError('');
  }, [lang]);

  const sampleLeaves = [
    {
      title: 'Wheat Stripe Rust',
      crop: 'Wheat',
      url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
      desc: 'Yellow stripe powdery pustules on foliage'
    },
    {
      title: 'Rice / Paddy Blast',
      crop: 'Rice / Paddy',
      url: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=600&auto=format&fit=crop&q=80',
      desc: 'Spindle-shaped spots on rice leaves'
    },
    {
      title: 'Tomato Blight',
      crop: 'Tomato',
      url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=600&auto=format&fit=crop&q=80',
      desc: 'Dark concentric brown rings on leaf with yellow edges'
    },
    {
      title: 'Cotton Bollworm',
      crop: 'Cotton',
      url: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&auto=format&fit=crop&q=80',
      desc: 'Bored holes and rosetted flower squares'
    }
  ];

  // Stop camera when unmounting or navigating away
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Connect stream to video element whenever camera modal is active
  useEffect(() => {
    if (isCameraModalOpen && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.warn('Video auto-play catch:', err);
      });
    }
  }, [isCameraModalOpen, isCameraActive, isCameraLoading]);

  const openCameraModal = () => {
    setIsCameraModalOpen(true);
    setCameraError('');
    startCameraStream(facingMode);
  };

  const closeCameraModal = () => {
    stopCameraStream();
    setIsCameraModalOpen(false);
    setCameraError('');
  };

  const startCameraStream = async (mode = facingMode) => {
    try {
      setCameraError('');
      setError('');
      setIsCameraLoading(true);
      stopCameraStream();

      // Check browser Camera API support
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError(
          lang === 'hi'
            ? 'कैमरा उपलब्ध नहीं है। कृपया कैमरा अनुमति दें और पुनः प्रयास करें, या गैलरी से फोटो अपलोड करें।'
            : 'Camera access is unavailable. Please allow camera permission and try again, or use Upload from Gallery.'
        );
        setIsCameraLoading(false);
        return;
      }

      let stream = null;
      // Step 3: First attempt rear/environment camera without microphone
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode } },
          audio: false
        });
      } catch (err1) {
        console.warn('Preferred facingMode camera failed, falling back to basic video for desktop/laptop:', err1);
        try {
          // Gracefully fall back to basic video without microphone
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        } catch (err2) {
          console.error('All camera attempts failed:', err2);
          throw err2;
        }
      }

      if (stream) {
        streamRef.current = stream;
        setIsCameraActive(true);
        setIsCameraLoading(false);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((playErr) => {
            console.warn('Video auto-play catch:', playErr);
          });
        }
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      stopCameraStream();
      setCameraError(
        lang === 'hi'
          ? 'कैमरा उपलब्ध नहीं है। कृपया कैमरा अनुमति दें और पुनः प्रयास करें, या गैलरी से फोटो अपलोड करें।'
          : 'Camera access is unavailable. Please allow camera permission and try again, or use Upload from Gallery.'
      );
      setIsCameraLoading(false);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsCameraLoading(false);
  };

  const switchCameraMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCameraStream(nextMode);
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Use actual video stream dimensions for crisp, high-resolution diagnostic capture
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `crop-camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        setSampleUrl('');
        setAnalysisResult(null); // Clear previous result immediately
        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);

        // Step 7: Immediately stop all camera tracks and close modal
        stopCameraStream();
        setIsCameraModalOpen(false);
        setFlashActive(true);
        setTimeout(() => setFlashActive(false), 250);

        // Step 5 & 6: Automatically trigger AI crop analysis workflow
        handleAnalyze(null, file);
      }
    }, 'image/jpeg', 0.92);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSampleUrl('');
      setAnalysisResult(null); // Clear previous result immediately
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
      setCameraError('');
      stopCameraStream();
    }
  };

  const handleSelectSample = (sample) => {
    setSymptomDescription(sample.desc || '');
    setSampleUrl(sample.url);
    setPreviewUrl(sample.url);
    setSelectedFile(null);
    setAnalysisResult(null); // Clear previous result immediately
    setError('');
    setCameraError('');
    stopCameraStream();
  };

  const handleAnalyze = async (e, fileOverride = null) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const fileToScan = fileOverride || selectedFile;
    if (!previewUrl && !fileToScan && !sampleUrl) {
      setError(lang === 'hi' ? 'कृपया फसल की एक फोटो चुनें या अपलोड करें।' : 'Please upload or select a crop photo to scan.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      // Requirement 4 & 5: Pass the farmer's selected language explicitly
      formData.append('language', lang);

      if (symptomDescription) {
        formData.append('symptomDescription', symptomDescription);
      }

      if (fileToScan) {
        formData.append('image', fileToScan);
      } else if (sampleUrl) {
        formData.append('sampleImageUrl', sampleUrl);
      }

      const res = await api.post('/analysis/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data?.data) {
        setAnalysisResult(res.data.data);
      } else if (res.data?.isIdentifiable === false || res.data?.data?.isIdentifiable === false) {
        setAnalysisResult({
          isIdentifiable: false,
          unclearMessage: res.data?.message || res.data?.data?.unclearMessage
        });
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.response?.data?.message || (lang === 'hi' ? 'AI रोग जांच में समस्या आई। पुनः प्रयास करें।' : 'Error running AI crop disease diagnosis.'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-600 text-white animate-pulse';
      case 'High':
        return 'bg-orange-500 text-white';
      case 'Medium':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-emerald-600 text-white';
    }
  };

  const shareOnWhatsApp = () => {
    if (!analysisResult) return;
    const problem = lang === 'hi' && analysisResult.detectedProblemHi ? analysisResult.detectedProblemHi : analysisResult.detectedProblem;
    const recAction = lang === 'hi' && analysisResult.recommendedActionHi ? analysisResult.recommendedActionHi : analysisResult.recommendedAction;
    
    const text = `🌾 *KRISHI DRISHTI AI DIAGNOSIS & PRESCRIPTION*\n` +
      `🌿 *Crop:* ${analysisResult.cropName}\n` +
      `🔍 *Detected Problem:* ${problem}\n` +
      `⚠️ *Severity:* ${analysisResult.severity} (${analysisResult.confidence}% AI Confidence)\n` +
      `💊 *Recommended Treatment:* ${recAction}\n` +
      `🌿 *Organic Option:* ${analysisResult.organicTreatment || 'N/A'}\n` +
      `🧪 *Chemical Option:* ${analysisResult.chemicalTreatment || 'N/A'}\n` +
      `⏱️ *Next Action Timeline:* ${analysisResult.nextActionTimeline || 'Inspect in 48h'}\n\n` +
      `_Generated via Krishi Drishti - From Space to Soil_`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrintPrescription = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-10">
      
      {/* Header */}
      <div className="text-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-agri-600 to-emerald-400 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
          <Camera className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">{t('diagnose.title')}</h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          {t('diagnose.subtitle')}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Camera Error Banner (Fallback with dual actions) */}
      {cameraError && !isCameraModalOpen && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{cameraError}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={openCameraModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'कैमरा पुनः प्रयास करें' : 'Try Camera Again'}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'गैलरी से फोटो चुनें' : 'Upload from Gallery'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PROPER FULLSCREEN / OVERLAY CAMERA MODAL */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2 text-white">
                <Camera className="w-5 h-5 text-emerald-400" />
                <span className="font-extrabold text-sm tracking-wide">
                  {lang === 'hi' ? 'कैमरा दृश्य (CAMERA VIEW)' : 'CAMERA VIEW'}
                </span>
              </div>
              <button
                type="button"
                onClick={closeCameraModal}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Cancel / Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera View Area */}
            <div className="relative aspect-4/3 sm:aspect-video bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraError ? 'hidden' : 'block'}`}
              />

              {/* Simulated flash on capture */}
              {flashActive && <div className="absolute inset-0 bg-white z-40 animate-ping" />}

              {/* Camera Loading Spinner */}
              {isCameraLoading && (
                <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center text-white gap-3 p-4">
                  <RefreshCw className="w-9 h-9 animate-spin text-emerald-400" />
                  <span className="text-sm font-bold text-center">
                    {lang === 'hi' ? 'कैमरा शुरू हो रहा है... अनुमति दें' : 'Starting camera feed... please allow camera permission'}
                  </span>
                </div>
              )}

              {/* Step 10: Camera Error Handling Dialog */}
              {cameraError && !isCameraLoading && (
                <div className="absolute inset-0 z-30 bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h4 className="font-black text-base text-amber-300">
                      {lang === 'hi' ? 'कैमरा एक्सेस उपलब्ध नहीं है' : 'Camera Access Unavailable'}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {cameraError}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => startCameraStream(facingMode)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>{lang === 'hi' ? 'पुनः प्रयास करें' : 'Try Camera Again'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        closeCameraModal();
                        fileInputRef.current?.click();
                      }}
                      className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{lang === 'hi' ? 'गैलरी से अपलोड' : 'Upload from Gallery'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Scanning Reticle guide when live */}
              {!isCameraLoading && !cameraError && (
                <div className="absolute inset-0 border-2 border-emerald-400/40 rounded-2xl pointer-events-none flex flex-col justify-between p-4 z-20">
                  <div className="flex justify-between items-center text-emerald-400 text-xs font-mono font-bold">
                    <span className="bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-xs">[ AI LEAF SCANNER ]</span>
                    <span className="bg-red-600/90 text-white px-2.5 py-0.5 rounded-full text-[10px] animate-pulse flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
                      LIVE
                    </span>
                  </div>

                  <div className="self-center w-48 h-48 sm:w-56 sm:h-56 border-2 border-dashed border-emerald-300/80 rounded-2xl flex items-center justify-center relative">
                    <div className="w-full h-0.5 bg-emerald-400/80 shadow-[0_0_12px_#10b981] animate-pulse"></div>
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-300"></div>
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-300"></div>
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-300"></div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-300"></div>
                  </div>

                  <div className="text-center text-[11px] text-emerald-200 font-bold bg-black/75 py-1.5 px-4 rounded-full backdrop-blur-md self-center shadow-md">
                    {lang === 'hi' ? 'रोगग्रस्त पत्ती को चौखट के बीच में रखें' : 'Center the infected leaf in the reticle'}
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls Bar */}
            {!cameraError && (
              <div className="p-4 bg-slate-950 flex items-center justify-between gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={switchCameraMode}
                  className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition active:scale-95"
                  title={lang === 'hi' ? 'कैमरा बदलें' : 'Switch Camera'}
                >
                  <SwitchCamera className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={captureSnapshot}
                  disabled={isCameraLoading}
                  className="flex-1 max-w-xs bg-gradient-to-r from-emerald-500 to-agri-600 hover:from-emerald-600 hover:to-agri-700 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm transition active:scale-95 disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                  <span>{lang === 'hi' ? 'फोटो खींचें (Capture Photo)' : 'Capture Photo'}</span>
                </button>

                <button
                  type="button"
                  onClick={closeCameraModal}
                  className="p-3 rounded-full bg-slate-800 hover:bg-red-900/40 hover:text-red-300 text-slate-400 transition active:scale-95"
                  title="Cancel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Scan Form */}
      <div className="agri-card p-5 bg-white border-slate-200 shadow-sm space-y-4">
        
        <form onSubmit={handleAnalyze} className="space-y-4">
          
          {/* Automatic AI Crop Identification Banner (No manual crop selection) */}
          <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 rounded-2xl text-xs text-emerald-950 font-semibold shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-extrabold text-emerald-950 text-xs sm:text-sm flex items-center gap-1.5">
                <span>🌱</span>
                <span>{t('diagnose.autoCropBanner')}</span>
              </p>
              <p className="text-[11px] text-emerald-800 font-normal mt-0.5">
                {lang === 'hi'
                  ? 'गेहूं, धान, टमाटर, आलू, कपास, मिर्च या किसी भी फसल की फोटो अपलोड करें — AI स्वतः पहचान करेगा।'
                  : 'Upload or capture any crop photo (Wheat, Rice, Tomato, Potato, Cotton, etc.) — AI will detect it automatically.'}
              </p>
            </div>
          </div>

          {/* Photo Selection or Preview Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {lang === 'hi' ? 'पत्ती / पौधे की फोटो (Camera / Gallery)' : 'Crop Leaf Photo (Camera / Gallery)'}
            </label>

            {previewUrl ? (
              /* Photo Preview Mode */
              <div className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 bg-slate-900 shadow-md">
                  <img
                    src={previewUrl}
                    alt="Crop preview"
                    className="w-full h-64 sm:h-72 object-cover object-center"
                  />

                  {/* Heatmap overlay bounding box indicator if diagnosis exists */}
                  {analysisResult && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-36 border-2 border-dashed border-red-400 bg-red-500/20 rounded-xl flex items-start justify-end p-1.5 animate-pulse">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded shadow-sm">
                          Pathology: {analysisResult.severity}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Active scanning progress banner if analyzing */}
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 p-4">
                      <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                        {lang === 'hi' ? 'AI द्वारा रोग का विश्लेषण हो रहा है...' : 'AI Analyzing Crop Health...'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Touch action bar for retake / change photo */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      openCameraModal();
                    }}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-agri-700 hover:from-emerald-700 hover:to-agri-800 text-white py-2.5 px-3 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'कैमरा से दूसरी फोटो लें' : 'Retake with Camera'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>{lang === 'hi' ? 'गैलरी' : 'Gallery'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Choose Camera or Gallery Upload Buttons */
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-5 sm:p-6 text-center bg-slate-50/50 hover:bg-emerald-50/30 transition">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  
                  {/* Button 1: Real Device Camera via Camera Modal (NO file input connection!) */}
                  <button
                    type="button"
                    id="btn-take-photo-camera"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openCameraModal();
                    }}
                    className="p-4 bg-gradient-to-r from-emerald-600 to-agri-700 hover:from-emerald-700 hover:to-agri-800 text-white rounded-2xl transition flex flex-col items-center justify-center gap-2 text-xs font-bold shadow-md active:scale-95 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
                      <Camera className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-black">{lang === 'hi' ? 'कैमरा से फोटो खींचें' : 'Take Photo (Camera)'}</span>
                    <span className="text-[10px] text-emerald-100 font-normal">
                      {lang === 'hi' ? 'डिवाइस कैमरा सीधे खुलेगा' : 'Opens device camera directly'}
                    </span>
                  </button>

                  {/* Button 2: Interactive Live WebRTC Viewfinder (Opens Camera Modal) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openCameraModal();
                    }}
                    className="p-4 bg-white hover:bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-2xl transition flex flex-col items-center justify-center gap-2 text-xs font-bold shadow-xs active:scale-95 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition">
                      <Video className="w-7 h-7 animate-pulse" />
                    </div>
                    <span className="text-sm font-black">{lang === 'hi' ? 'लाइव वीडियो स्कैनर' : 'Live Viewfinder'}</span>
                    <span className="text-[10px] text-emerald-700 font-normal">
                      {lang === 'hi' ? 'स्क्रीन पर लाइव व्यू' : 'Interactive video scanner'}
                    </span>
                  </button>

                  {/* Button 3: Upload from Gallery / File picker */}
                  <button
                    type="button"
                    id="btn-upload-gallery"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="p-4 bg-white hover:bg-sky-50 text-sky-950 border border-sky-200 rounded-2xl transition flex flex-col items-center justify-center gap-2 text-xs font-bold shadow-xs active:scale-95 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-110 transition">
                      <Upload className="w-7 h-7 text-sky-700" />
                    </div>
                    <span className="text-sm font-black">{lang === 'hi' ? 'गैलरी से फोटो चुनें' : 'Upload from Gallery'}</span>
                    <span className="text-[10px] text-sky-700 font-normal">
                      {lang === 'hi' ? 'फोटो या फाइल चुनें' : 'Browse saved photos'}
                    </span>
                  </button>

                </div>
                <p className="text-[11px] text-slate-500">
                  {lang === 'hi' ? '💡 सलाह: बेहतर AI जांच के लिए पत्ती के रोगग्रस्त भाग की स्पष्ट रोशनी में फोटो लें।' : '💡 Tip: Capture a clear, close photo of the affected leaf surface under good light.'}
                </p>
              </div>
            )}

            {/* Hidden file input strictly reserved for Upload from Gallery */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Hidden canvas used for video frame snapshot rendering */}
            <canvas ref={canvasRef} className="hidden"></canvas>
          </div>

          {/* Sample Photos Selector for 1-click test */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              {t('diagnose.samplePhotos')}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {sampleLeaves.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition ${
                    sampleUrl === sample.url
                      ? 'bg-agri-50 border-agri-500 ring-2 ring-agri-200'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <img
                    src={sample.url}
                    alt={sample.title}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-[11px] text-slate-800 truncate">{sample.title}</p>
                    <p className="text-[10px] text-slate-500 truncate">{sample.crop}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Symptom Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('diagnose.describeProblem')}
            </label>
            <textarea
              rows={2}
              value={symptomDescription}
              onChange={(e) => setSymptomDescription(e.target.value)}
              placeholder={t('diagnose.describePlaceholder')}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
            ></textarea>
          </div>

          {/* Analyze Button */}
          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full agri-btn-primary py-3.5 text-sm font-bold shadow-lg mt-2 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t('diagnose.analyzing')}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>{t('diagnose.btnScan')}</span>
              </>
            )}
          </button>

        </form>

      </div>

      {/* Low-Confidence / Unclear Image Banner (Requirement 9) */}
      {analysisResult && (analysisResult.isIdentifiable === false || analysisResult.unclearMessage) && (
        <div className="agri-card p-5 bg-amber-50/95 border-2 border-amber-300 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-6 h-6 text-amber-800" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                {lang === 'hi' ? 'पहचान अस्पष्ट' : 'Unclear Image'}
              </span>
              <h3 className="text-base font-black text-amber-950">
                {lang === 'hi' ? 'फसल की पहचान नहीं हो सकी' : 'Could Not Confidently Identify Crop'}
              </h3>
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                {analysisResult.unclearMessage || t('diagnose.unclearImageMsg')}
              </p>
            </div>
          </div>

          <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-900">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{lang === 'hi' ? 'स्पष्ट फोटो के लिए सुझाव:' : 'Tips for a Clear Photo:'}</span>
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900 pl-1">
              <li>{lang === 'hi' ? 'अच्छी रोशनी में पौधे या प्रभावित पत्ती की नजदीक से फोटो लें।' : 'Take a close photo of the plant or affected leaf in good light.'}</li>
              <li>{lang === 'hi' ? 'कैमरा फोकस साफ रखें और धुंधली तस्वीरों से बचें।' : 'Keep the camera focused and avoid blurry or shaky pictures.'}</li>
              <li>{lang === 'hi' ? 'पत्ती के आगे और पीछे दोनों हिस्सों का स्पष्ट दृश्य रखें।' : 'Ensure the leaf surface and symptoms are clearly visible.'}</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              type="button"
              onClick={openCameraModal}
              className="w-full sm:flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>{lang === 'hi' ? 'कैमरे से साफ फोटो लें' : 'Retake Clear Photo'}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:flex-1 py-3 px-4 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95"
            >
              <Upload className="w-4 h-4 text-amber-800" />
              <span>{lang === 'hi' ? 'गैलरी से दूसरी फोटो चुनें' : 'Upload Another Photo'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Structured AI Agriculture Result (Requirement 8) */}
      {analysisResult && analysisResult.isIdentifiable !== false && !analysisResult.unclearMessage && (
        <div className="agri-card p-5 bg-white border-agri-300 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-3 printable-card">
          
          {/* 🌱 Section 1: Detected Crop & Confidence */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-agri-600 to-emerald-400 text-white flex items-center justify-center shadow-md shrink-0">
                <Leaf className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                    <span>🌱</span>
                    <span>{t('diagnose.detectedCrop')}: <strong>{analysisResult.cropName}</strong></span>
                  </span>
                  {analysisResult.confidence ? (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                      {analysisResult.confidence}% {t('diagnose.confidence')}
                    </span>
                  ) : null}
                </div>
                
                {/* 🩺 Section 2: Crop Health / Problem */}
                <h3 className="text-xl font-black text-slate-900 mt-1.5 flex items-center gap-2">
                  <span className="text-base">🩺</span>
                  <span>{lang === 'hi' && analysisResult.detectedProblemHi ? analysisResult.detectedProblemHi : analysisResult.detectedProblem}</span>
                </h3>
              </div>
            </div>

            <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shrink-0 shadow-xs ${getSeverityBadge(analysisResult.severity)}`}>
              {analysisResult.severity}
            </span>
          </div>

          {/* Audio voice reader on the diagnostic outcome */}
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-700">
              {lang === 'hi' ? 'रोग निदान व उपचार विवरण सुनें:' : 'Listen to Diagnosis & Treatment:'}
            </span>
            <VoiceReader
              textToRead={`${analysisResult.cropName}. ${analysisResult.detectedProblem}. Severity is ${analysisResult.severity}. Recommended action: ${analysisResult.recommendedAction}. Next step: ${analysisResult.nextActionTimeline}`}
              textToReadHi={`पहचानी गई फसल: ${analysisResult.cropName}। ${analysisResult.detectedProblemHi || analysisResult.detectedProblem}। गंभीरता स्तर ${analysisResult.severity} है। अनुशंसित उपाय: ${analysisResult.recommendedActionHi || analysisResult.recommendedAction}`}
            />
          </div>

          {/* 📋 Section 3: What AI Found */}
          {(analysisResult.whatAiFound || analysisResult.cause) && (
            <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 space-y-1 text-xs">
              <p className="font-bold text-amber-950 flex items-center gap-1.5">
                <span className="text-sm">📋</span>
                <span>{t('diagnose.whatAiFound')}</span>
              </p>
              <p className="text-amber-900 text-xs leading-relaxed">
                {analysisResult.whatAiFound || (lang === 'hi' && analysisResult.causeHi ? analysisResult.causeHi : analysisResult.cause)}
              </p>
            </div>
          )}

          {/* 💊 Section 4: Recommended Solution */}
          <div className="space-y-3">
            <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200">
              <p className="font-bold text-emerald-950 flex items-center gap-1.5 mb-1 text-xs">
                <span className="text-sm">💊</span>
                <span>{t('diagnose.recommendedSolution')}</span>
              </p>
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                {lang === 'hi' && analysisResult.recommendedActionHi ? analysisResult.recommendedActionHi : analysisResult.recommendedAction}
              </p>
            </div>

            {/* Organic vs Chemical Treatment cards */}
            {(analysisResult.organicTreatment || analysisResult.chemicalTreatment) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {analysisResult.organicTreatment && (
                  <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                    <span className="font-bold text-green-900 block mb-1">
                      🌿 {t('diagnose.organicTreatment')}
                    </span>
                    <p className="text-green-800 text-[11px] leading-relaxed">
                      {analysisResult.organicTreatment}
                    </p>
                  </div>
                )}

                {analysisResult.chemicalTreatment && (
                  <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                    <span className="font-bold text-sky-900 block mb-1">
                      🧪 {t('diagnose.chemicalTreatment')}
                    </span>
                    <p className="text-sky-800 text-[11px] leading-relaxed">
                      {analysisResult.chemicalTreatment}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 🛡️ Section 5: Prevention Tips */}
          {analysisResult.preventionTips && (Array.isArray(analysisResult.preventionTips) ? analysisResult.preventionTips.length > 0 : true) && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="text-sm">🛡️</span>
                <span>{t('diagnose.preventionTips')}</span>
              </p>
              {Array.isArray(analysisResult.preventionTips) ? (
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 pl-1">
                  {analysisResult.preventionTips.map((tip, idx) => (
                    <li key={idx} className="leading-relaxed">{tip}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-700 text-[11px] leading-relaxed">{analysisResult.preventionTips}</p>
              )}
            </div>
          )}

          {/* ⚠️ Section 6: Important Note (Show only when present) */}
          {analysisResult.importantNote && (
            <div className="p-3 bg-red-50/80 rounded-xl border border-red-200 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-red-950 block">
                  {t('diagnose.importantNote')}
                </span>
                <p className="text-red-900 text-[11px] leading-relaxed">
                  {analysisResult.importantNote}
                </p>
              </div>
            </div>
          )}

          {/* Timeline & Next Step */}
          {analysisResult.nextActionTimeline && (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-purple-950 block">
                  {t('diagnose.nextStep')}:
                </span>
                <p className="text-purple-900 text-[11px] mt-0.5">
                  {analysisResult.nextActionTimeline}
                </p>
              </div>
            </div>
          )}

          {/* 1-Click WhatsApp Share & Download Prescription Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={shareOnWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 text-xs transition active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>{t('diagnose.shareWhatsApp')}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPrescription}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 text-xs transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{t('diagnose.downloadPrescription')}</span>
            </button>
          </div>

          {/* Action plan notification & CTA */}
          <div className="p-3 bg-agri-100 text-agri-900 rounded-xl flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold">
              ✓ {t('diagnose.actionPlanCreated')}
            </span>
            <button
              onClick={() => setActiveTab('plans')}
              className="font-bold text-agri-800 underline hover:text-agri-950 flex items-center gap-1 shrink-0"
            >
              <span>{t('dashboard.viewAllTasks')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Continuous Feedback Loop */}
          <FeedbackModal
            cropAnalysisId={analysisResult._id}
            cropName={analysisResult.cropName}
          />

        </div>
      )}

    </div>
  );
}
