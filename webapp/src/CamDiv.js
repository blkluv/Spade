import React, {useEffect} from "react"
import Webcam from "react-webcam";

function CamDiv({ cameraEnabled, webcamRef, onCapture }) {
    useEffect(() => {
        if (cameraEnabled && webcamRef.current) {
            const captureImage = () => {
              console.log("captureImage");
              const video = webcamRef.current.video; // Access the video element
              if (video && onCapture) {
                onCapture(video); // Pass the video element
              }
            };

            // Capture an image every 5 seconds (example)
            const interval = setInterval(captureImage, 2000);

            return () => clearInterval(interval); // Clean up on unmount
        }
    }, [cameraEnabled, webcamRef, onCapture]);

    return (
        <div>
            {cameraEnabled ? (<div>scanning...<div style={{ display: "none" }}>
                {cameraEnabled && (
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        width={300}
                        height={300}
                        videoConstraints={{
                            width: 300,
                            height: 300,
                            facingMode: "user", // Use the front-facing camera
                        }}
                    />
                )}
            </div></div>) : <div>Cards not scanned</div>}
        </div>
    );
}

export default CamDiv;