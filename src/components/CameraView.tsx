import React from 'react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  showPreview: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ videoRef, isActive, showPreview }) => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Hidden video used for MediaPipe — always needs to be in DOM when active */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${
          showPreview ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-500`}
        style={{ transform: 'scaleX(-1)' }}
      />
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-cyan-500/30 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-cyan-500/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.902L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                />
              </svg>
            </div>
            <p className="text-cyan-500/60 text-sm font-medium tracking-widest uppercase">
              Camera offline
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraView;
