"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, Check, X, AlertCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LiveSelfieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureConfirm: (dataUrl: string) => Promise<void>;
}

export function LiveSelfieModal({ isOpen, onClose, onCaptureConfirm }: LiveSelfieModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<"INITIALIZING" | "READY" | "CAPTURED" | "PERMISSION_DENIED" | "ERROR">("INITIALIZING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraState("INITIALIZING");
    setErrorMessage(null);
    setCapturedImage(null);

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported on this browser or device.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => console.warn("Video play error:", err));
          setCameraState("READY");
        };
      } else {
        setCameraState("READY");
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraState("PERMISSION_DENIED");
        setErrorMessage("Camera permission was denied. Please allow camera access in your browser address bar.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraState("ERROR");
        setErrorMessage("No front camera detected on your system. You can upload a photo from your gallery instead.");
      } else {
        setCameraState("ERROR");
        setErrorMessage(err.message || "Could not access camera. Please check permissions or upload from files.");
      }
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Capture Frame to Canvas
  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const width = video.videoWidth || 480;
    const height = video.videoHeight || 480;
    const size = Math.min(width, height);

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Center crop square & horizontal flip mirror
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    const startX = (width - size) / 2;
    const startY = (height - size) / 2;
    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl);
    setCameraState("CAPTURED");
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCameraState("READY");
  };

  const handleConfirm = async () => {
    if (!capturedImage) return;
    setSaving(true);
    try {
      await onCaptureConfirm(capturedImage);
      stopCamera();
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to save profile picture.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-rose-100 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="selfie-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-rose-50/50 to-amber-50/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 id="selfie-modal-title" className="text-sm font-bold text-gray-900 font-serif">
                Live Selfie &amp; Liveness Verification
              </h2>
              <p className="text-[11px] text-gray-500">
                Position your face inside the circle (+25% Trust Shield)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Close camera modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Content */}
        <div className="p-6 flex flex-col items-center justify-center space-y-4">
          {cameraState === "INITIALIZING" && (
            <div className="w-72 h-72 rounded-full border-4 border-dashed border-rose-300 flex flex-col items-center justify-center bg-gray-50 text-gray-500 text-xs gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-brand-600" />
              <span>Requesting camera permission…</span>
            </div>
          )}

          {cameraState === "PERMISSION_DENIED" && (
            <div className="w-full p-6 text-center space-y-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <p className="font-bold text-sm">Camera Permission Blocked</p>
              <p className="text-amber-800 leading-relaxed">
                {errorMessage || "Browser camera permission was denied. Please click the lock or camera icon in your address bar to allow camera access."}
              </p>
              <Button type="button" size="sm" variant="outline" onClick={startCamera}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Camera Again
              </Button>
            </div>
          )}

          {cameraState === "ERROR" && (
            <div className="w-full p-6 text-center space-y-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
              <p className="font-bold text-sm">Camera Unavailable</p>
              <p className="text-red-700 leading-relaxed">{errorMessage}</p>
              <Button type="button" size="sm" variant="outline" onClick={startCamera}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Camera
              </Button>
            </div>
          )}

          {/* Live Video Viewfinder */}
          {(cameraState === "READY" || cameraState === "INITIALIZING") && (
            <div className={`relative w-72 h-72 rounded-full overflow-hidden border-4 border-brand-500 shadow-xl bg-black ${cameraState === "INITIALIZING" ? "hidden" : "block"}`}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {/* Facial Alignment Overlay Guide */}
              <div className="absolute inset-0 pointer-events-none border-2 border-white/60 rounded-full flex items-center justify-center">
                <div className="w-48 h-60 border-2 border-dashed border-emerald-400/80 rounded-[50%] flex items-end justify-center pb-4">
                  <span className="text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    Align Face Here
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Captured Preview */}
          {cameraState === "CAPTURED" && capturedImage && (
            <div className="relative w-72 h-72 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl bg-gray-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Captured Selfie Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-emerald-600 text-white p-1 rounded-full shadow-md">
                <Check className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Helper Instruction */}
          <div className="text-center text-xs text-gray-500 max-w-xs">
            {cameraState === "READY" && (
              <p>Look straight into the camera, ensure good lighting, and click capture.</p>
            )}
            {cameraState === "CAPTURED" && (
              <p className="text-emerald-700 font-medium flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Live biometric portrait captured. Ready to set as profile picture.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          {cameraState === "READY" && (
            <>
              <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCapture}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white"
              >
                <Camera className="w-4 h-4 mr-2" /> Capture Selfie
              </Button>
            </>
          )}

          {cameraState === "CAPTURED" && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRetake}
                disabled={saving}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retake
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirm}
                isLoading={saving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="w-4 h-4 mr-1.5" /> Save as Profile Photo (+25%)
              </Button>
            </>
          )}

          {(cameraState === "PERMISSION_DENIED" || cameraState === "ERROR") && (
            <Button type="button" variant="secondary" size="sm" onClick={onClose} className="w-full">
              Close &amp; Use Gallery Upload
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
