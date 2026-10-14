import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, AlertCircle, SwitchCamera } from 'lucide-react';

export default function LiveCameraModal({ isOpen, onClose, onCapture, title = 'Capture Live Photo' }) {
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // back camera preferred for road issues
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Check available cameras
  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      if (videoDevices.length > 1) {
        setHasMultipleCameras(true);
      }
    }).catch(() => {});
  }, []);

  // Start video stream when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setCapturedPhoto(null);
      setError('');
      return;
    }
    startCamera(facingMode);
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startCamera = async (facing) => {
    stopStream();
    setLoading(true);
    setError('');

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings to take live photos.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera device found on this system.');
      } else {
        setError('Unable to access camera: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    const sourceWidth = video.videoWidth || 1280;
    const sourceHeight = video.videoHeight || 720;
    const scale = Math.min(1, 1600 / Math.max(sourceWidth, sourceHeight));
    canvas.width = Math.round(sourceWidth * scale);
    canvas.height = Math.round(sourceHeight * scale);
    const ctx = canvas.getContext('2d');
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `live-photo-${Date.now()}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
      const previewUrl = URL.createObjectURL(blob);
      setCapturedPhoto({ file, previewUrl });
    }, 'image/jpeg', 0.84);
  };

  const retakePhoto = () => {
    if (capturedPhoto?.previewUrl) {
      URL.revokeObjectURL(capturedPhoto.previewUrl);
    }
    setCapturedPhoto(null);
    if (!stream) {
      startCamera(facingMode);
    }
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto.file, capturedPhoto.previewUrl);
      // The parent now owns this preview URL until the photo is replaced or the page closes.
      setCapturedPhoto(null);
      stopStream();
      onClose();
    }
  };

  const handleClose = () => {
    stopStream();
    if (capturedPhoto?.previewUrl) {
      URL.revokeObjectURL(capturedPhoto.previewUrl);
    }
    setCapturedPhoto(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl border border-slate-800">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <h3 className="font-semibold text-sm text-slate-100">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative aspect-[4/3] w-full bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{error}</p>
                <p className="text-xs text-slate-400 mt-1">
                  CivicLens requires live camera captures to verify genuine issues.
                </p>
              </div>

            </div>
          ) : capturedPhoto ? (
            /* Review captured photo */
            <div className="relative h-full w-full">
              <img
                src={capturedPhoto.previewUrl}
                alt="Captured live"
                className="h-full w-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md rounded-full px-3 py-1 text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> Live Photo Captured
              </div>
            </div>
          ) : (
            /* Live Stream */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
                onLoadedMetadata={() => videoRef.current?.play()}
              />

              {/* Viewfinder overlay grid & reticle */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-52 w-52 rounded-2xl border-2 border-white/40 border-dashed relative">
                  <div className="absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-[#0066FF]" />
                  <div className="absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-[#0066FF]" />
                  <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-[#0066FF]" />
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-[#0066FF]" />
                </div>
              </div>

              {/* Switch camera button */}
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="absolute top-3 right-3 rounded-full bg-black/50 p-2.5 backdrop-blur-md text-white hover:bg-black/70 transition"
                  title="Switch Camera"
                >
                  <SwitchCamera className="h-5 w-5" />
                </button>
              )}

              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <RefreshCw className="h-8 w-8 text-[#0066FF] animate-spin" />
                </div>
              )}
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Bottom Controls */}
        <div className="p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-center">
          {capturedPhoto ? (
            <div className="flex w-full items-center gap-3">
              <button
                type="button"
                onClick={retakePhoto}
                className="btn-ghost flex-1 !bg-slate-800 !text-slate-200 !border-slate-700 hover:!bg-slate-700"
              >
                <RefreshCw className="h-4 w-4" /> Retake
              </button>
              <button
                type="button"
                onClick={confirmPhoto}
                className="btn-primary flex-1"
              >
                <Check className="h-4 w-4" /> Use Live Photo
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={takeSnapshot}
                disabled={loading || !!error}
                className="group relative flex h-18 w-18 items-center justify-center rounded-full border-4 border-white/80 bg-white/20 p-1 transition-all active:scale-95 disabled:opacity-40"
              >
                <div className="h-14 w-14 rounded-full bg-[#0066FF] shadow-[0_0_20px_rgba(0,102,255,0.8)] group-hover:scale-105 transition-transform flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </button>
              <span className="text-xs text-slate-400">Tap to capture live photo</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

