import React, { useEffect, useRef, useState } from 'react';
import { AppItem, ExerciseState, ExerciseType } from '../../types';
import { calculateAngle } from '../../utils/geometry';
import { loadProfile } from '../../utils/storage';
import { ArrowLeft, RefreshCw, CheckCircle2, ChevronDown, Info, X, ArrowDown, Zap } from 'lucide-react';

// Declare globals for CDN scripts
declare const window: any;

interface LockScreenProps {
  app: AppItem;
  onUnlock: (type: ExerciseType, reps: number) => void;
  onCancel: () => void;
}

const EXERCISE_OPTIONS = [
  { type: ExerciseType.PUSHUPS, label: 'Pushups' },
  { type: ExerciseType.SQUATS, label: 'Squats' },
  { type: ExerciseType.JUMPING_JACKS, label: 'Jacks' },
];

const EXERCISE_GUIDES = {
  [ExerciseType.PUSHUPS]: {
    title: "How to do Pushups",
    steps: [
      "Ensure your upper body (head, shoulders, elbows) is visible.",
      "Start in a high plank position with arms extended (UP state).",
      "Lower your body by bending your elbows.",
      "Push back up to the starting position to count 1 rep."
    ],
    tips: "You can face the camera or be side-on. Just make sure your shoulders and elbows are visible."
  },
  [ExerciseType.SQUATS]: {
    title: "How to do Squats",
    steps: [
      "Ensure your full body (head to toe) is visible.",
      "Stand straight with feet shoulder-width apart (UP state).",
      "Lower your hips as if sitting in a chair until knees are bent (< 100°).",
      "Stand back up to the starting position to count 1 rep."
    ],
    tips: "Keep your chest up and ensure the camera sees your legs clearly."
  },
  [ExerciseType.JUMPING_JACKS]: {
    title: "How to do Jumping Jacks",
    steps: [
      "Ensure your full body is visible in the camera.",
      "Start standing with feet together and arms at your sides (DOWN state).",
      "Jump to spread your feet while raising arms above your head (UP state).",
      "Jump back to the starting position to count 1 rep."
    ],
    tips: "Make sure your hands go above your shoulders and back down."
  }
};

const LockScreen: React.FC<LockScreenProps> = ({ app, onUnlock, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState("Get into position");
  const [loading, setLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [exerciseState, setExerciseState] = useState<ExerciseState>(ExerciseState.IDLE);
  const [activeExercise, setActiveExercise] = useState<ExerciseType>(ExerciseType.PUSHUPS);
  const [showInfo, setShowInfo] = useState(false);

  // Refs for logic to avoid closure staleness in loop
  const countRef = useRef(0);
  const stateRef = useRef<ExerciseState>(ExerciseState.IDLE);
  const exerciseRef = useRef<ExerciseType>(ExerciseType.PUSHUPS);
  const pushupTrackerRef = useRef({ wristY: 0, shoulderY: 0 });
  
  const profileRef = useRef(loadProfile());
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const playBeep = () => {
    const soundEnabled = profileRef.current.soundEnabled ?? true;
    if (!soundEnabled || !audioCtxRef.current) return;

    const play = () => {
      try {
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        // A nice pleasant bell-like beep (880 Hz)
        oscillator.frequency.value = 880;

        // Set volume to 0.5 and fade out over 0.3 seconds
        gainNode.gain.value = 0.5;
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
      } catch (e) {
        console.warn("Could not play beep", e);
      }
    };

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().then(play).catch(e => console.warn("Audio resume failed", e));
    } else {
      play();
    }
  };

  // Sync ref with state
  useEffect(() => {
    exerciseRef.current = activeExercise;
    // Reset progress when exercise changes
    countRef.current = 0;
    setReps(0);
    stateRef.current = ExerciseState.IDLE;
    setFeedback("Get into position");
    setExerciseState(ExerciseState.IDLE);
  }, [activeExercise]);

  useEffect(() => {
    let camera: any = null;
    let pose: any = null;
    let active = true;

    const onResults = (results: any) => {
      setLoading(false);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      // Draw
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.poseLandmarks) {
        const landmarks = results.poseLandmarks;
        const currentType = exerciseRef.current;
        const width = canvas.width;
        const height = canvas.height;
        const cyan = '#00ffff';

        // 1. Draw glowing dashed lines
        ctx.lineWidth = 4;
        ctx.strokeStyle = cyan;
        ctx.shadowColor = cyan;
        ctx.shadowBlur = 8;
        ctx.setLineDash([10, 8]);
        
        window.POSE_CONNECTIONS.forEach(([startIdx, endIdx]: [number, number]) => {
          // Only draw body connections (ignore face landmarks 0-10)
          if (startIdx >= 11 && endIdx >= 11) {
            const start = landmarks[startIdx];
            const end = landmarks[endIdx];
            if (start.visibility > 0.5 && end.visibility > 0.5) {
              ctx.beginPath();
              ctx.moveTo(start.x * width, start.y * height);
              ctx.lineTo(end.x * width, end.y * height);
              ctx.stroke();
            }
          }
        });
        
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        
        // 2. Draw Hexagon Nodes
        landmarks.forEach((landmark: any, index: number) => {
          // Only draw body nodes (ignore face landmarks 0-10)
          if (index >= 11 && landmark.visibility > 0.5) {
            const x = landmark.x * width;
            const y = landmark.y * height;
            const size = 7;
            
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i - Math.PI / 6;
              const px = x + size * Math.cos(angle);
              const py = y + size * Math.sin(angle);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = cyan;
            ctx.stroke();
            
            // Inner dot
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fillStyle = cyan;
            ctx.fill();
          }
        });

        // --- FULL BODY VISIBILITY CHECK ---
        const nose = landmarks[0];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const leftElbow = landmarks[13];
        const rightElbow = landmarks[14];
        const leftWrist = landmarks[15];
        const rightWrist = landmarks[16];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftKnee = landmarks[25];
        const rightKnee = landmarks[26];
        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];

        const isHeadVisible = nose.visibility > 0.5;
        let isFullBodyVisible = false;

        if (currentType === ExerciseType.PUSHUPS) {
          // For pushups, legs might be hidden. When facing camera, require both arms. Otherwise, at least one arm.
          const leftArmVis = leftShoulder.visibility > 0.5 && leftElbow.visibility > 0.5;
          const rightArmVis = rightShoulder.visibility > 0.5 && rightElbow.visibility > 0.5;
          const shoulderXDiff = Math.abs(leftShoulder.x - rightShoulder.x);
          const isFacingCamera = leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5 && shoulderXDiff > 0.15;
          
          if (isFacingCamera) {
            isFullBodyVisible = isHeadVisible && leftArmVis && rightArmVis;
          } else {
            isFullBodyVisible = isHeadVisible && (leftArmVis || rightArmVis);
          }
        } else if (currentType === ExerciseType.SQUATS) {
          // For squats, ensure head and at least one leg is visible.
          const leftLegVis = leftHip.visibility > 0.5 && leftKnee.visibility > 0.5;
          const rightLegVis = rightHip.visibility > 0.5 && rightKnee.visibility > 0.5;
          isFullBodyVisible = isHeadVisible && (leftLegVis || rightLegVis);
        } else if (currentType === ExerciseType.JUMPING_JACKS) {
          // For jumping jacks, extremities (wrists/ankles) might leave the frame. Only strictly require shoulders/elbows/hips/knees.
          const leftArmVis = leftShoulder.visibility > 0.5 && leftElbow.visibility > 0.5;
          const rightArmVis = rightShoulder.visibility > 0.5 && rightElbow.visibility > 0.5;
          const leftLegVis = leftHip.visibility > 0.5 && leftKnee.visibility > 0.5;
          const rightLegVis = rightHip.visibility > 0.5 && rightKnee.visibility > 0.5;
          isFullBodyVisible = isHeadVisible && leftArmVis && rightArmVis && leftLegVis && rightLegVis;
        }

        if (!isFullBodyVisible) {
          if (stateRef.current !== ExerciseState.COMPLETED) {
            setFeedback("Please make sure your body is visible in the camera");
          }
        } else {
          // --- EXERCISE LOGIC ---

          if (currentType === ExerciseType.PUSHUPS) {
            // Find the most visible side to support both left and right-facing users
            const leftArmVis = (leftShoulder.visibility + leftElbow.visibility + leftWrist.visibility) / 3;
            const rightArmVis = (rightShoulder.visibility + rightElbow.visibility + rightWrist.visibility) / 3;
            
            const useLeft = leftArmVis > rightArmVis;
            const shoulder = useLeft ? leftShoulder : rightShoulder;
            const elbow = useLeft ? leftElbow : rightElbow;
            const wrist = useLeft ? leftWrist : rightWrist;
            const hip = useLeft ? leftHip : rightHip;

            // Detect if user is facing the camera (both shoulders visible & far apart in X)
            const shoulderXDiff = Math.abs(leftShoulder.x - rightShoulder.x);
            const isFacingCamera = leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5 && shoulderXDiff > 0.15;

            let isDown = false;
            let isUp = false;
            let currentWristY = 0;
            let currentShoulderY = 0;

            if (isFacingCamera) {
              // When facing camera, arm angle is unreliable. 
              // Use the vertical position of shoulders relative to elbows/wrists.
              // DOWN: shoulders drop close to or below elbow level
              // UP: shoulders are well above elbow level
              const avgElbowY = (leftElbow.y + rightElbow.y) / 2;
              const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
              const yDiff = avgElbowY - avgShoulderY; // positive = shoulders above elbows

              isUp = yDiff > 0.06;   // shoulders clearly above elbows
              isDown = yDiff < 0.02; // shoulders near elbow level
              
              currentWristY = (leftWrist.y + rightWrist.y) / 2;
              currentShoulderY = avgShoulderY;
            } else {
              // Side-on view: use arm angle (relaxed thresholds)
              const armAngle = calculateAngle(shoulder, elbow, wrist);
              isUp = armAngle > 140;   // was 150, now more forgiving
              isDown = armAngle < 110;  // was 90, now much more forgiving
              
              currentWristY = wrist.y;
              currentShoulderY = shoulder.y;
            }

            if (isUp) {
              if (stateRef.current === ExerciseState.DOWN) {
                const wristDiff = Math.abs(currentWristY - pushupTrackerRef.current.wristY);
                const shoulderDiff = pushupTrackerRef.current.shoulderY - currentShoulderY; // positive if shoulder moved UP
                
                if (wristDiff < 0.15 && shoulderDiff > 0.04) {
                  countRef.current += 1;
                  playBeep();
                  setReps(countRef.current);
                  stateRef.current = ExerciseState.UP;
                  setFeedback("Good! Down again.");
                  pushupTrackerRef.current = { wristY: currentWristY, shoulderY: currentShoulderY };
                } else {
                  setFeedback("Keep palms still and move body!");
                }
              } else if (stateRef.current !== ExerciseState.COMPLETED) {
                stateRef.current = ExerciseState.UP;
                setFeedback("Start going down");
                pushupTrackerRef.current = { wristY: currentWristY, shoulderY: currentShoulderY };
              }
            } else if (isDown) {
              if (stateRef.current === ExerciseState.UP || stateRef.current === ExerciseState.IDLE) {
                stateRef.current = ExerciseState.DOWN;
                setFeedback("Push UP!");
              }
              pushupTrackerRef.current = { wristY: currentWristY, shoulderY: currentShoulderY };
            }

          } else if (currentType === ExerciseType.SQUATS) {
            // Choose the more visible leg
            const leftLegVis = (leftHip.visibility + leftKnee.visibility + leftAnkle.visibility) / 3;
            const rightLegVis = (rightHip.visibility + rightKnee.visibility + rightAnkle.visibility) / 3;

            const useLeft = leftLegVis > rightLegVis;
            const hip = useLeft ? leftHip : rightHip;
            const knee = useLeft ? leftKnee : rightKnee;
            const ankle = useLeft ? leftAnkle : rightAnkle;

            const legAngle = calculateAngle(hip, knee, ankle);

            // Standing (UP) ~ 150-180
            // Squat (DOWN) < 100

            if (legAngle > 150) { // STANDING
              if (stateRef.current === ExerciseState.DOWN) {
                countRef.current += 1;
                playBeep();
                setReps(countRef.current);
                stateRef.current = ExerciseState.UP;
                setFeedback("Great! Squat down.");
              } else if (stateRef.current !== ExerciseState.COMPLETED) {
                stateRef.current = ExerciseState.UP;
                setFeedback("Squat down");
              }
            } else if (legAngle < 100) { // SQUATTING
              if (stateRef.current === ExerciseState.UP) {
                stateRef.current = ExerciseState.DOWN;
                setFeedback("Stand UP!");
              }
            }

          } else if (currentType === ExerciseType.JUMPING_JACKS) {
            const headY = nose.y;

            // Fallback to elbows if wrists are missing
            const getHandY = (wrist: any, elbow: any) => wrist.visibility > 0.5 ? wrist.y : elbow.y;
            const leftHandY = getHandY(leftWrist, leftElbow);
            const rightHandY = getHandY(rightWrist, rightElbow);

            // UP: arms above the head or highest point
            const handsUp = leftHandY < headY && rightHandY < headY;
            
            // DOWN: arms lowered back below the shoulder line
            const handsDown = leftHandY > leftShoulder.y && rightHandY > rightShoulder.y;
            
            // Fallback to knees if ankles are missing
            const getFootX = (ankle: any, knee: any) => ankle.visibility > 0.5 ? ankle.x : knee.x;
            const leftFootX = getFootX(leftAnkle, leftKnee);
            const rightFootX = getFootX(rightAnkle, rightKnee);

            const feetDist = Math.abs(leftFootX - rightFootX);
            const shoulderDist = Math.abs(leftShoulder.x - rightShoulder.x);
            
            const ratio = shoulderDist > 0.01 ? feetDist / shoulderDist : 1;
            const feetWide = ratio > 1.2;
            const feetTogether = ratio <= 1.2;

            // Enforce form
            if (handsDown && feetTogether) { // DOWN (Start/End position)
              if (stateRef.current === ExerciseState.UP) {
                countRef.current += 1;
                playBeep();
                setReps(countRef.current);
                stateRef.current = ExerciseState.DOWN;
                setFeedback("Good! Jump up.");
              } else if (stateRef.current !== ExerciseState.COMPLETED) {
                stateRef.current = ExerciseState.DOWN;
                setFeedback("Jump!");
              }
            } else if (handsUp && feetWide) { // UP (Star position)
              if (stateRef.current === ExerciseState.DOWN || stateRef.current === ExerciseState.IDLE) {
                stateRef.current = ExerciseState.UP;
                setFeedback("Back down!");
              }
            }
          }
        }

        // 3. Draw Overlay Box
        let displayAngle = 0;
        let angleName = "Angle";
        let targetNode = landmarks[23]; // Default to left hip
        
        if (currentType === ExerciseType.SQUATS) {
          angleName = "Hips";
          const leftHip = landmarks[23], rightHip = landmarks[24], leftKnee = landmarks[25], rightKnee = landmarks[26], leftAnkle = landmarks[27], rightAnkle = landmarks[28];
          const useLeft = ((leftHip.visibility + leftKnee.visibility + leftAnkle.visibility) / 3) > ((rightHip.visibility + rightKnee.visibility + rightAnkle.visibility) / 3);
          const hip = useLeft ? leftHip : rightHip;
          displayAngle = calculateAngle(hip, useLeft ? leftKnee : rightKnee, useLeft ? leftAnkle : rightAnkle);
          targetNode = hip;
        } else if (currentType === ExerciseType.PUSHUPS) {
          angleName = "Elbow";
          const leftShoulder = landmarks[11], rightShoulder = landmarks[12], leftElbow = landmarks[13], rightElbow = landmarks[14], leftWrist = landmarks[15], rightWrist = landmarks[16];
          const useLeft = ((leftShoulder.visibility + leftElbow.visibility + leftWrist.visibility) / 3) > ((rightShoulder.visibility + rightElbow.visibility + rightWrist.visibility) / 3);
          const elbow = useLeft ? leftElbow : rightElbow;
          displayAngle = calculateAngle(useLeft ? leftShoulder : rightShoulder, elbow, useLeft ? leftWrist : rightWrist);
          targetNode = elbow;
        } else if (currentType === ExerciseType.JUMPING_JACKS) {
          angleName = "Shoulder";
          const leftShoulder = landmarks[11], rightShoulder = landmarks[12], leftElbow = landmarks[13], rightElbow = landmarks[14], leftHip = landmarks[23], rightHip = landmarks[24];
          const useLeft = leftShoulder.visibility > rightShoulder.visibility;
          const shoulder = useLeft ? leftShoulder : rightShoulder;
          displayAngle = calculateAngle(useLeft ? leftHip : rightHip, shoulder, useLeft ? leftElbow : rightElbow);
          targetNode = shoulder;
        }

        if (targetNode && targetNode.visibility > 0.5) {
          const nodeX = targetNode.x * width;
          const nodeY = targetNode.y * height;
          
          ctx.save();
          // Move context to the node's position and flip horizontally
          // This prevents text from being mirrored by the canvas CSS flip
          ctx.translate(nodeX, nodeY);
          ctx.scale(-1, 1);
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.beginPath();
          // Draw rect extending leftwards in the flipped context (rightwards on screen)
          ctx.roundRect(20, -18, 85, 26, 8);
          ctx.fill();
          
          ctx.font = '14px sans-serif';
          ctx.fillStyle = '#00ffff';
          // Draw text left-aligned in the flipped context
          ctx.fillText(`${angleName}: ${Math.round(displayAngle)}°`, 28, 0);
          
          ctx.restore();
        }
      }
      ctx.restore();

      // Check win condition
      if (countRef.current >= app.requiredReps && stateRef.current !== ExerciseState.COMPLETED) {
        setFeedback("Access Granted!");
        setExerciseState(ExerciseState.COMPLETED);
        // Stop counting
        stateRef.current = ExerciseState.COMPLETED;
        // Store values to avoid closure issues in timeout
        const completedExercise = exerciseRef.current;
        const completedReps = countRef.current;

        setTimeout(() => {
          onUnlock(completedExercise, completedReps);
        }, 1500);
      }
    };

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    const initMediaPipe = async () => {
      try {
        if (!videoRef.current) {
          setCameraError('Camera element not ready. Please go back and try again.');
          return;
        }

        // --- PARALLEL INIT: Start camera + Pose model at the same time ---
        console.log('[FitLock] Starting parallel init: Camera + Pose model...');

        // Task 1: Request camera stream
        const cameraPromise = (async () => {
          console.log('[FitLock] Requesting camera...');
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' }
          });
          console.log('[FitLock] Camera stream acquired.');
          return stream;
        })();

        // Task 2: Create and configure Pose model
        const posePromise = (async () => {
          console.log('[FitLock] Creating Pose instance...');
          pose = new window.Pose({
            locateFile: (file: string) => `/mediapipe/${file}`,
          });
          pose.setOptions({
            modelComplexity: 0,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });
          pose.onResults(onResults);
          // Pre-initialize the WASM/model (uses cache if preloaded in App.tsx)
          await pose.initialize();
          console.log('[FitLock] Pose model initialized.');
        })();

        // Wait for both to complete
        let stream: MediaStream;
        try {
          const [cameraStream] = await Promise.all([cameraPromise, posePromise]);
          stream = cameraStream;
        } catch (err: any) {
          if (!active) {
            // If already unmounted, check if stream was somehow allocated
            try {
              const s = await cameraPromise;
              s.getTracks().forEach(t => t.stop());
            } catch {}
            return;
          }
          // Determine which one failed
          if (err?.name === 'NotAllowedError' || err?.message?.includes('permission')) {
            setCameraError(`Camera access denied: ${err?.message || 'Unknown'}. Please grant camera permission.`);
          } else {
            setCameraError(`Initialization failed: ${err?.message || 'Unknown error'}`);
          }
          return;
        }

        if (!active) {
          console.log('[FitLock] Unmounted during camera/pose init. Cleaning up immediately.');
          if (stream) stream.getTracks().forEach(t => t.stop());
          if (pose) { try { pose.close(); } catch {} }
          return;
        }

        // Assign stream and wait for video to have pixel data
        console.log('[FitLock] Waiting for video data...');
        const video = videoRef.current;
        if (!video) {
          if (stream) stream.getTracks().forEach(t => t.stop());
          if (pose) { try { pose.close(); } catch {} }
          return;
        }
        video.srcObject = stream;

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Video load timeout')), 10000);
          video.onloadeddata = () => {
            clearTimeout(timeout);
            resolve();
          };
          video.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Video element error'));
          };
          video.play().catch(reject);
        });

        if (!active) {
          console.log('[FitLock] Unmounted during video ready wait. Cleaning up immediately.');
          if (stream) stream.getTracks().forEach(t => t.stop());
          if (pose) { try { pose.close(); } catch {} }
          return;
        }

        console.log('[FitLock] Video ready, size:', video.videoWidth, 'x', video.videoHeight);

        // Send first frame to warm up the pipeline
        console.log('[FitLock] Processing first frame...');
        try {
          await pose.send({ image: video });
          console.log('[FitLock] First frame processed.');
        } catch (e) {
          console.warn('[FitLock] First frame failed, retrying...', e);
          await new Promise(r => setTimeout(r, 500));
          if (!active) {
            if (stream) stream.getTracks().forEach(t => t.stop());
            if (pose) { try { pose.close(); } catch {} }
            return;
          }
          await pose.send({ image: video });
          console.log('[FitLock] Retry succeeded.');
        }

        if (!active) {
          if (stream) stream.getTracks().forEach(t => t.stop());
          if (pose) { try { pose.close(); } catch {} }
          return;
        }

        // Non-blocking frame loop: skip frames while pose is still processing
        console.log('[FitLock] Starting frame loop...');
        let running = true;
        let processing = false;
        const processFrame = () => {
          if (!active || !running || !videoRef.current || !pose) return;
          if (!processing) {
            processing = true;
            pose.send({ image: videoRef.current }).then(() => {
              processing = false;
            }).catch((e: any) => {
              processing = false;
              console.error('[FitLock] Frame error:', e);
            });
          }
          if (running && active) {
            requestAnimationFrame(processFrame);
          }
        };
        requestAnimationFrame(processFrame);

        // Store cleanup
        camera = {
          stop: () => {
            running = false;
            stream.getTracks().forEach(t => t.stop());
            if (pose) pose.close();
          }
        } as any;

      } catch (err: any) {
        console.error('[FitLock] initMediaPipe FATAL:', err);
        if (active) {
          setCameraError(`Camera failed: ${err?.message || 'Unknown error'}`);
        }
      }
    };

    // Timeout: if still loading overall after 20s, show error
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('[FitLock] TIMEOUT: Camera init took too long');
        setCameraError('Camera initialization timed out. Please go back and try again.');
      }
    }, 20000);

    // Start immediately if CDN script is loaded, otherwise poll quickly (100ms)
    if (window.Pose) {
      initMediaPipe();
    } else {
      let attempts = 0;
      pollInterval = setInterval(() => {
        if (window.Pose) {
          clearInterval(pollInterval!);
          pollInterval = null;
          initMediaPipe();
        } else {
          attempts++;
          if (attempts >= 100) { // 100 * 100ms = 10s
            clearInterval(pollInterval!);
            pollInterval = null;
            setCameraError('Exercise AI download took too long. Please check your internet connection and try again.');
          }
        }
      }, 100);
    }

    return () => {
      active = false;
      try {
        clearTimeout(timeoutId);
        clearInterval(pollInterval);
        if (camera) {
          try { camera.stop(); } catch (e) { console.warn('camera.stop() failed', e); }
        }
        if (pose) {
          try { pose.close(); } catch (e) { console.warn('pose.close() failed', e); }
        }
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => {
            try { track.stop(); } catch (e) { console.warn('track.stop() failed', e); }
          });
          videoRef.current.srcObject = null;
        }
      } catch (err) {
        console.error('Error during LockScreen unmount:', err);
      }
    };
  }, [app.requiredReps, onUnlock]);

  const activeGuide = EXERCISE_GUIDES[activeExercise];

  const renderExerciseAnimation = () => {
    switch (activeExercise) {
      case ExerciseType.PUSHUPS:
        return (
          <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center relative overflow-hidden ring-4 ring-blue-500/30">
            <div className="absolute inset-0 bg-blue-500/10 animate-ping rounded-full" />
            <ArrowDown size={40} className="text-blue-400 animate-bounce" />
          </div>
        );
      case ExerciseType.SQUATS:
        return (
          <div className="w-24 h-24 bg-green-600/20 rounded-full flex items-center justify-center relative overflow-hidden ring-4 ring-green-500/30">
            <div className="absolute inset-0 bg-green-500/10 animate-pulse rounded-full" />
            <div className="flex flex-col items-center animate-bounce">
              <ChevronDown size={32} className="text-green-400 -mb-2" />
              <ChevronDown size={32} className="text-green-400" />
            </div>
          </div>
        );
      case ExerciseType.JUMPING_JACKS:
        return (
          <div className="w-24 h-24 bg-orange-600/20 rounded-full flex items-center justify-center relative overflow-hidden ring-4 ring-orange-500/30">
            <div className="absolute inset-0 bg-orange-500/10 animate-ping rounded-full" />
            <Zap size={40} className="text-orange-400 animate-pulse scale-125 duration-700" />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col landscape:flex-row-reverse flex-1 w-full h-full bg-gray-900 relative text-white overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 w-full z-30 px-4 pt-10 pb-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent landscape:from-transparent landscape:bg-none pointer-events-none">
        <button onClick={onCancel} className="p-2 rounded-full bg-white/10 hover:bg-white/20 pointer-events-auto backdrop-blur-sm">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="font-bold text-sm bg-red-600 px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">Locked</span>
        </div>
      </div>

      {/* Camera Layer */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900">
            <div className="flex flex-col items-center px-6 text-center">
              {cameraError ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                    <X size={32} className="text-red-400" />
                  </div>
                  <p className="text-red-400 font-medium mb-2">Camera Error</p>
                  <p className="text-gray-400 text-sm max-w-xs">{cameraError}</p>
                  <button
                    onClick={onCancel}
                    className="mt-6 px-6 py-2 bg-gray-700 text-white rounded-xl text-sm font-medium hover:bg-gray-600 transition-colors"
                  >
                    Go Back
                  </button>
                </>
              ) : (
                <>
                  <RefreshCw className="animate-spin mb-4 text-blue-500" size={32} />
                  <p className="text-gray-400">Starting AI Camera...</p>
                </>
              )}
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className="absolute opacity-0 w-full h-full object-cover"
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute w-full h-full object-cover scale-x-[-1]"
          width={640}
          height={480}
        />

        {/* Animation Overlay when IDLE */}
        {!loading && reps === 0 && exerciseState === ExerciseState.IDLE && !showInfo && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm p-8 rounded-3xl flex flex-col items-center animate-in fade-in duration-500">
              {renderExerciseAnimation()}
              <p className="text-white font-bold mt-6 text-xl drop-shadow-md text-center">Start {activeExercise}</p>
              <p className="text-blue-200 text-sm mt-1 text-center font-medium">Position yourself to begin</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls / Status */}
      <div
        className="bg-gray-900 rounded-t-3xl -mt-6 landscape:rounded-t-none landscape:rounded-r-3xl landscape:-mt-0 landscape:-mr-6 z-20 pt-6 px-6 landscape:pt-16 flex flex-col items-center landscape:justify-center landscape:w-[45%] landscape:max-w-md shadow-2xl border-t landscape:border-t-0 landscape:border-r border-gray-800"
        style={{ paddingBottom: 'calc(5rem + var(--nav-bar-height, 0px))' }}
      >
        <div className="flex items-center justify-between w-full mb-4 landscape:mb-8">
          <h2 className="text-xl font-bold">Unlock {app.name}</h2>
          <button
            onClick={() => setShowInfo(true)}
            className="p-2 bg-gray-800 rounded-full text-blue-400 hover:bg-gray-700 hover:text-blue-300 transition-colors"
            aria-label="How to perform exercise"
          >
            <Info size={20} />
          </button>
        </div>

        {/* Exercise Selector */}
        <div className="flex gap-2 mb-6 bg-gray-800/50 p-1 rounded-xl">
          {EXERCISE_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => setActiveExercise(opt.type)}
              className={`
                    px-4 py-2 rounded-lg text-xs font-bold transition-all
                    ${activeExercise === opt.type
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'}
                  `}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center w-full gap-8">
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Reps</span>
            <span className="text-5xl font-black font-mono text-white">{reps}/{app.requiredReps}</span>
          </div>

          <div className="h-12 w-px bg-gray-700" />

          <div className="flex flex-col items-center w-40 text-center">
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Status</span>
            {exerciseState === ExerciseState.COMPLETED ? (
              <div className="flex items-center gap-1 text-green-400 font-bold justify-center">
                <CheckCircle2 size={20} />
                <span>Success</span>
              </div>
            ) : (
              <span className="text-sm font-medium text-blue-400 animate-pulse">{feedback}</span>
            )}
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-gray-800 border border-gray-700 w-full max-w-sm rounded-3xl p-6 relative shadow-2xl">
            <button
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-white mb-4 pr-8">{activeGuide.title}</h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Instructions</h4>
                <ul className="space-y-2">
                  {activeGuide.steps.map((step, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">{idx + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1 text-blue-400">
                  <Info size={14} />
                  <span className="text-xs font-bold uppercase">Pro Tip</span>
                </div>
                <p className="text-xs text-blue-200/80 leading-relaxed">{activeGuide.tips}</p>
              </div>
            </div>

            <button
              onClick={() => setShowInfo(false)}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-6 hover:bg-blue-500 active:scale-95 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Celebration Overlay */}
      {exerciseState === ExerciseState.COMPLETED && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-green-600/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white/20 p-8 rounded-full mb-6 shadow-2xl animate-bounce">
            <CheckCircle2 size={80} className="text-white" strokeWidth={3} />
          </div>
          <h2 className="text-4xl font-black text-white tracking-widest uppercase animate-pulse">Unlocked</h2>
          <p className="text-white/80 mt-2 font-medium">Great job! Access Granted.</p>
        </div>
      )}
    </div>
  );
};

export default LockScreen;