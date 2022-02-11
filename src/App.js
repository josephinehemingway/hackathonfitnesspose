// // 1. Install dependencies DONE
// // 2. Import dependencies DONE
// // 3. Setup webcam and canvas DONE
// // 4. Define references to those DONE
// // 5. Load posenet DONE
// // 6. Detect function DONE
// // 7. Drawing utilities from tensorflow DONE
// // 8. Draw functions DONE

// import React, { useRef } from "react";
// import "./App.css";
// import * as tf from "@tensorflow/tfjs";
// import * as posenet from "@tensorflow-models/posenet";
// import Webcam from "react-webcam";
// import { drawKeypoints, drawSkeleton } from "./utilities";

// function App() {
//   const webcamRef = useRef(null);
//   const canvasRef = useRef(null);

//   //  Load posenet
//   const runPosenet = async () => {
//     const net = await posenet.load({
//       inputResolution: { width: 640, height: 480 },
//       scale: 0.8,
//     });
//     //
//     setInterval(() => {
//       detect(net);
//     }, 100);
//   };

//   const detect = async (net) => {
//     if (
//       typeof webcamRef.current !== "undefined" &&
//       webcamRef.current !== null &&
//       webcamRef.current.video.readyState === 4
//     ) {
//       // Get Video Properties
//       const video = webcamRef.current.video;
//       const videoWidth = webcamRef.current.video.videoWidth;
//       const videoHeight = webcamRef.current.video.videoHeight;

//       // Set video width
//       webcamRef.current.video.width = videoWidth;
//       webcamRef.current.video.height = videoHeight;

//       // Make Detections
//       const pose = await net.estimateSinglePose(video);
//       console.log(pose);

//       drawCanvas(pose, video, videoWidth, videoHeight, canvasRef);
//     }
//   };

//   const drawCanvas = (pose, video, videoWidth, videoHeight, canvas) => {
//     const ctx = canvas.current.getContext("2d");
//     canvas.current.width = videoWidth;
//     canvas.current.height = videoHeight;

//     drawKeypoints(pose["keypoints"], 0.6, ctx);
//     drawSkeleton(pose["keypoints"], 0.7, ctx);
//   };

//   runPosenet();

//   return (
//     <div className="App">
//       <header className="App-header">
//         <Webcam
//           ref={webcamRef}
//           style={{
//             position: "absolute",
//             marginLeft: "auto",
//             marginRight: "auto",
//             left: 0,
//             right: 0,
//             textAlign: "center",
//             zindex: 9,
//             width: 640,
//             height: 480,
//           }}
//         />

//         <canvas
//           ref={canvasRef}
//           style={{
//             position: "absolute",
//             marginLeft: "auto",
//             marginRight: "auto",
//             left: 0,
//             right: 0,
//             textAlign: "center",
//             zindex: 9,
//             width: 640,
//             height: 480,
//           }}
//         />
//       </header>
//     </div>
//   );
// }

// export default App;

import React, { useRef, useEffect, useState } from "react"
import './App.css';
import { Pose, LandmarkGrid } from '@mediapipe/pose';
import * as p from '@mediapipe/pose';
import * as cam from '@mediapipe/camera_utils';
import Webcam from "react-webcam";



function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkRef = useRef(null);
  var camera = null;
  const connect = window.drawConnectors;

  function onResults(results) {
    const landmarkContainer = landmarkRef.current;
    const grid = new LandmarkGrid(landmarkContainer);

    if (!results.poseLandmarks) {
      grid.updateLandmarks([]);
      return;
    }

    const videoW = webcamRef.current.video.videoWidth;
    const videoH = webcamRef.current.video.videoHeight;
    //Setting H,W of Canvas

    canvasRef.current.width = videoW;
    canvasRef.current.height = videoH;

    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");
    canvasCtx.save();

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);

    // Only overwrite existing pixels.
    canvasCtx.globalCompositeOperation = 'source-in';
    canvasCtx.fillStyle = '#00FF00';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Only overwrite missing pixels.
    canvasCtx.globalCompositeOperation = 'destination-atop';
    canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.globalCompositeOperation = 'source-over';
    if (results.poseLandmarks) {
      for (const landmarks of results.poseLandmarks) {
        connect(canvasCtx, landmarks, p.POSE_CONNECTIONS,
          { color: '#00FF00', lineWidth: 4 });
        connect(canvasCtx, landmarks,
          { color: '#FF0000', lineWidth: 2 });
      }
    }
    canvasCtx.restore();
    console.log(results)
  }

  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      }
    })

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    pose.onResults(onResults);

    if (typeof webcamRef.current !== "undefined" && webcamRef.current !== null) {
      camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          await pose.send({ image: webcamRef.current.video });
        },
        width: 640,
        height: 480
      });
      camera.start();
    }
  }, []);


  return (
    <center>

      <div className="App">
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 9,
            width: 640,
            height: 480,
          }}
        />{" "}

        <canvas
          ref={canvasRef}
          className="output_canvas"
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        ></canvas>

        <div 
        className="landmark-grid-container">
        </div>

        {/* <iframe width="600" height="400" src="https://data.gov.sg/dataset/nparks-playfitness-equipment/resource/0049a8cd-4f50-4afa-8944-2a5d3afc8dd1/view/4c3cf92d-1380-4c77-86eb-a1fe07926d92" frameBorder="0"> </iframe> */}
      </div>
    </center>
  );
}

export default App;

// import React, { useEffect, useRef, useState } from 'react';
// import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'

// import { Pose } from "@mediapipe/pose";
// import * as mediapipePose from '@mediapipe/pose'
// import Webcam from 'react-webcam'
// import * as cam from '@mediapipe/camera_utils'

// const UserPose = () => {
// // * refs to the html elements
// const webcamRef = useRef(null);
// const canvasRef = useRef(null);
// // const landmarkRef = useRef(null);
// let userPoseAngle = null;
// let camera = null;
// let down;
// let repsCounter = 0;

// const [repCounter, setRepCounter] = useState(null)
// // let repsCounter = 0;
// // * function to draw the landmarks once the pose has been determined
// function onResults(results) {
//     let landmarks = results.poseLandmarks // * all the landmarks in the pose

//     //  * getting the values for the three landmarks that we want to use
//     try { // * we get errors every time the landmarks are not available
//         // * will provide dynamic landmarks later "landmarks[mediapipePose.POSE_LANDMARKS.{landmark}]"
//         let leftShoulder = landmarks[mediapipePose.POSE_LANDMARKS.LEFT_SHOULDER];
//         let leftElbow = landmarks[mediapipePose.POSE_LANDMARKS.LEFT_ELBOW];
//         let leftWrist = landmarks[mediapipePose.POSE_LANDMARKS.LEFT_WRIST];
//         calculatePoseAngle(leftShoulder, leftElbow, leftWrist);
//     } catch (error) {
//         // console.error(error);
//     }
//     // Define the canvas element dimensions using the earlier created refs
//     canvasRef.current.width = webcamRef.current.video.videoWidth
//     canvasRef.current.height = webcamRef.current.video.videoHeight

//     const canvasElement = canvasRef.current;
//     const canvasCtx = canvasElement.getContext("2d")
//     canvasCtx.save();
//     canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
//     canvasCtx.drawImage(results.image,
//         0,
//         0,
//         canvasElement.width,
//         canvasElement.height
//     )
//     drawConnectors(canvasCtx,
//         results.poseLandmarks, mediapipePose.POSE_CONNECTIONS,
//         { color: 'white', lineWidth: 1 });
//     // * The dots are the landmarks 
//     drawLandmarks(canvasCtx, results.poseLandmarks,
//         { color: 'red', lineWidth: 1, radius: 2 });
//     canvasCtx.restore();
// }

// // * calculating the angles in the user pose
// const calculatePoseAngle = (a, b, c) => {
//     let radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x) // * fetching the radians using the atan2 function 
//     let angle = radians * (180 / Math.PI) // * calculating the angle from the radian
//     // need to provide dynamic values for angles as per requirement later along with the number of reps.
//     if (angle > 180) { // * if the angle is greater than 180, then it is negative so changing it back to positive or an actual angle possible for a human being, lol..
//         angle = 360 - angle
//     }
//     if (angle > 0 && angle < 180) { // * if the angle is positive, then it is a positive angle
//         // console.log(angle.toFixed(2), "currentAngle");
//     }
//     userPoseAngle = angle.toFixed(2);
//     calculateReps(userPoseAngle);
// }
// const calculateReps = (angle) => {
//     // console.log(angle);
//     if (angle >= 160) {
//         down = true;
//     }
//     if (angle <= 40 && down) {
//         down = false;
//         // setRepCounter(repCounter + 1);
//         repsCounter += 1;
//         console.log(repsCounter, "repsCounter");
//     }
//     // console.log('out');
//     // console.log(repsCounter, "repsCounter");
// }
// useEffect(() => {
//     const userPose = new Pose({
//         locateFile: (file) => {
//             return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
//         },
//     });
//     userPose.setOptions({
//         maxNumFaces: 1,
//         minDetectionConfidence: 0.8,
//         minTrackingConfidence: 0.8,
//     });
//     userPose.onResults(onResults);
//     if (
//         typeof webcamRef.current !== "undefined" &&
//         webcamRef.current !== null
//     ) {
//         camera = new cam.Camera(webcamRef.current.video, { // no issues with the exaustive-deps. We do not need to store the camera object for current purposes
//             onFrame: async () => {
//                 await userPose.send({ image: webcamRef.current.video });
//             },
//             width: 1280,
//             height: 720,
//         });
//         camera.start();
//     }
// }, []);
// return <div>
//     <div className="App">
//         <h1>{repCounter}</h1>
//         <Webcam
//             ref={webcamRef}
//             style={{
//                 position: "absolute",
//                 marginLeft: "auto",
//                 marginRight: "auto",
//                 left: 0,
//                 right: 0,
//                 textAlign: "center",
//                 zindex: 9,
//                 width: 1280,
//                 height: 720,
//             }}
//         />
//         <canvas
//             ref={canvasRef}
//             style={{
//                 position: "absolute",
//                 marginLeft: "auto",
//                 marginRight: "auto",
//                 left: 0,
//                 right: 0,
//                 textAlign: "center",
//                 zindex: 9,
//                 width: 1280,
//                 height: 720,
//             }}
//         ></canvas>
//         <div className="landmark-grid-container"></div>
//     </div>
// </div>
// };

// export default UserPose;