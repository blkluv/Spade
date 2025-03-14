import React, { useEffect } from "react";
import Webcam from "react-webcam";

function CamDiv({ cameraEnabled, webcamRef, onCapture }) {
  useEffect(() => {
    if (cameraEnabled && webcamRef.current) {
      const captureImage = () => {
        const video = webcamRef.current.video;
        if (video && onCapture) {
          onCapture(video);
        }
      };

      // Capture an image in specified intervals
      const interval = setInterval(captureImage, 800);
      return () => clearInterval(interval);
    }
  }, [cameraEnabled, webcamRef, onCapture]);

  return (
    <div className="cam-container">
      {cameraEnabled ? (
        <div className="scanning-status">
          <span>Scanning for cards...</span>
          <div className="webcam-container">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: 720,
                height: 480,
                facingMode: "user",
              }}
            />
          </div>
        </div>
      ) : (
        <div className="cam-placeholder">
          <span>Enable camera to scan cards</span>
        </div>
      )}
    </div>
  );
}

export default CamDiv;
