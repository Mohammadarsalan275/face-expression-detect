import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

function FaceExpression() {
  const videoRef = useRef(null);
  const [expression, setExpression] = useState("Detecting...");

  useEffect(() => {
    const setup = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );

      const faceLandmarker = await FaceLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
        }
      );

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      videoRef.current.srcObject = stream;

      videoRef.current.onloadeddata = () => {
        detectFace(faceLandmarker);
      };
    };

    setup();
  }, []);

  const detectFace = (faceLandmarker) => {
    if (!videoRef.current) return;

    const result = faceLandmarker.detectForVideo(
      videoRef.current,
      performance.now()
    );

    if (result.faceBlendshapes?.length > 0) {
      const blendshapes =
        result.faceBlendshapes[0].categories;

      const getScore = (name) => {
        const item = blendshapes.find(
          (b) => b.categoryName === name
        );

        return item ? item.score : 0;
      };

      const smileLeft = getScore("mouthSmileLeft");
      const smileRight = getScore("mouthSmileRight");

      const smile = (smileLeft + smileRight) / 2;

      if (smile > 0.5) {
        setExpression("😊 Happy");
      } else {
        setExpression("😐 Neutral");
      }
    }

    requestAnimationFrame(() => detectFace(faceLandmarker));
  };

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        width="640"
      />

      <h2>Expression: {expression}</h2>
    </div>
  );
}

export default FaceExpression;