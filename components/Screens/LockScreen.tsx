import React, { useEffect, useRef, useState } from 'react';
import { AppItem, ExerciseState, ExerciseType } from '../../types';
import { calculateAngle } from '../../utils/geometry';
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
      "Ensure your upper body (shoulders, elbows, wrists) is fully visible.",
      "Start in a high plank position with arms straight (UP state).",
      "Lower your body until your elbows are bent significantly (< 90°).",
      "Push back up to the starting position to count 1 rep."
    ],
    tips: "Keep your back straight and face the camera side-on for best detection."
  },
  [ExerciseType.SQUATS]: {
    title: "How to do Squats",
    steps: [
      "Ensure your full body (specifically hips, knees, ankles) is visible.",
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
  const [exerciseState, setExerciseState] = useState<ExerciseState>(ExerciseState.IDLE);
  const [activeExercise, setActiveExercise] = useState<ExerciseType>(ExerciseType.PUSHUPS);
  const [showInfo, setShowInfo] = useState(false);

  // Refs for logic to avoid closure staleness in loop
  const countRef = useRef(0);
  const stateRef = useRef<ExerciseState>(ExerciseState.IDLE);
  const exerciseRef = useRef<ExerciseType>(ExerciseType.PUSHUPS);

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
        // Use light blue (#38bdf8 - sky-400) for both connectors and landmarks
        const lightBlue = '#38bdf8';

        window.drawConnectors(ctx, results.poseLandmarks, window.POSE_CONNECTIONS,
          { color: lightBlue, lineWidth: 4 });

        window.drawLandmarks(ctx, results.poseLandmarks,
          { color: lightBlue, lineWidth: 2, fillColor: lightBlue, radius: 4 });

        const landmarks = results.poseLandmarks;
        const currentType = exerciseRef.current;

        // --- EXERCISE LOGIC ---

        if (currentType === ExerciseType.PUSHUPS) {
          // Pushups Logic
          // Left side: 11 (shoulder), 13 (elbow), 15 (wrist)
          const leftShoulder = landmarks[11];
          const leftElbow = landmarks[13];
          const leftWrist = landmarks[15];

          if (leftShoulder.visibility > 0.5 && leftElbow.visibility > 0.5 && leftWrist.visibility > 0.5) {
            const angle = calculateAngle(leftShoulder, leftElbow, leftWrist);

            if (angle > 160) { // UP
              if (stateRef.current === ExerciseState.DOWN) {
                countRef.current += 1;
                setReps(countRef.current);
                stateRef.current = ExerciseState.UP;
                setFeedback("Good! Down again.");
              } else if (stateRef.current !== ExerciseState.COMPLETED) {
                stateRef.current = ExerciseState.UP;
                setFeedback("Start going down");
              }
            } else if (angle < 90) { // DOWN
              if (stateRef.current === ExerciseState.UP) {
                stateRef.current = ExerciseState.DOWN;
                setFeedback("Push UP!");
              }
            }
          } else {
            setFeedback("Make sure your arm is visible");
          }

        } else if (currentType === ExerciseType.SQUATS) {
          // Squats Logic
          // Left side: 23 (hip), 25 (knee), 27 (ankle)
          const leftHip = landmarks[23];
          const leftKnee = landmarks[25];
          const leftAnkle = landmarks[27];

          if (leftHip.visibility > 0.5 && leftKnee.visibility > 0.5 && leftAnkle.visibility > 0.5) {
            const angle = calculateAngle(leftHip, leftKnee, leftAnkle);

            // Standing (UP) ~ 170-180
            // Squat (DOWN) < 100

            if (angle > 160) { // STANDING
              if (stateRef.current === ExerciseState.DOWN) {
                countRef.current += 1;
                setReps(countRef.current);
                stateRef.current = ExerciseState.UP;
                setFeedback("Great! Squat down.");
              } else if (stateRef.current !== ExerciseState.COMPLETED) {
                stateRef.current = ExerciseState.UP;
                setFeedback("Squat down");
              }
            } else if (angle < 100) { // SQUATTING
              if (stateRef.current === ExerciseState.UP) {
                stateRef.current = ExerciseState.DOWN;
                setFeedback("Stand UP!");
              }
            }
          } else {
            setFeedback("Make sure your legs are visible");
          }

        } else if (currentType === ExerciseType.JUMPING_JACKS) {
          // Jumping Jacks Logic
          // Wrists vs Shoulders/Hips
          const leftShoulder = landmarks[11];
          const rightShoulder = landmarks[12];
          const leftHip = landmarks[23];
          const rightHip = landmarks[24];
          const leftWrist = landmarks[15];
          const rightWrist = landmarks[16];

          const isVisible = [leftShoulder, rightShoulder, leftHip, rightHip, leftWrist, rightWrist].every(l => l.visibility > 0.5);

          if (isVisible) {
            // Hands UP: Wrist y < Shoulder y (y increases downwards)
            const handsUp = leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;
            // Hands DOWN: Wrist y > Hip y
            const handsDown = leftWrist.y > leftHip.y && rightWrist.y > rightHip.y;

            if (handsDown) { // DOWN (Start/End position)
              if (stateRef.current === ExerciseState.UP) {
                countRef.current += 1;
                setReps(countRef.current);
                stateRef.current = ExerciseState.DOWN;
                setFeedback("Good! Jump up.");
              } else if (stateRef.current !== ExerciseState.COMPLETED) {
                stateRef.current = ExerciseState.DOWN;
                setFeedback("Jump!");
              }
            } else if (handsUp) { // UP (Star position)
              if (stateRef.current === ExerciseState.DOWN || stateRef.current === ExerciseState.IDLE) {
                stateRef.current = ExerciseState.UP;
                setFeedback("Back down!");
              }
            }
          } else {
            setFeedback("Full body must be visible");
          }
        }
      }
      ctx.restore();

      // Check win condition
      if (countRef.current >= app.requiredReps) {
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

    const initMediaPipe = async () => {
      if (!window.Pose) {
        console.error("MediaPipe Pose not loaded");
        return;
      }

      // Use local mediapipe files for offline support
      pose = new window.Pose({
        locateFile: (file: string) => `./mediapipe/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults(onResults);

      if (videoRef.current) {
        camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await pose.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });
        camera.start();
      }
    };

    // Small delay to ensure scripts loaded
    setTimeout(initMediaPipe, 1000);

    return () => {
      if (camera) camera.stop();
      if (pose) pose.close();
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
    <div className="flex flex-col h-full bg-gray-900 relative text-white overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 w-full z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onCancel} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm bg-red-600 px-3 py-1 rounded-full uppercase tracking-wider">Locked</span>
        </div>
      </div>

      {/* Camera Layer */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900">
            <div className="flex flex-col items-center">
              <RefreshCw className="animate-spin mb-4 text-blue-500" size={32} />
              <p className="text-gray-400">Starting AI Camera...</p>
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
      <div className="bg-gray-900 rounded-t-3xl -mt-6 z-20 p-6 flex flex-col items-center shadow-2xl border-t border-gray-800">
        <div className="flex items-center justify-between w-full mb-4">
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