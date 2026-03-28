import React from 'react';
import { HistoryItem, ExerciseType } from '../../types';
import { Activity, Calendar, Clock, Dumbbell, Zap, Footprints } from 'lucide-react';

interface HistoryScreenProps {
  history: HistoryItem[];
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history }) => {
  
  const getExerciseIcon = (type: ExerciseType) => {
    switch (type) {
      case ExerciseType.PUSHUPS: return <Dumbbell size={20} className="text-blue-500" />;
      case ExerciseType.SQUATS: return <Activity size={20} className="text-green-500" />;
      case ExerciseType.JUMPING_JACKS: return <Zap size={20} className="text-orange-500" />;
      default: return <Activity size={20} />;
    }
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500 pb-20">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Clock size={40} className="text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">No Activity Yet</h3>
        <p className="text-sm">Complete workout challenges to unlock apps and see your history here.</p>
      </div>
    );
  }

  // Sort by newest first
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="p-4 space-y-4 pb-24 max-w-3xl mx-auto w-full">
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
          <Activity size={24} />
        </div>
        <div>
           <h3 className="font-bold text-blue-800 text-lg">{history.length} Workouts</h3>
           <p className="text-xs text-blue-600">Total completed sessions</p>
        </div>
      </div>

      <div className="space-y-3">
        {sortedHistory.map((item) => {
          const date = new Date(item.timestamp);
          const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                  {getExerciseIcon(item.exerciseType)}
                </div>
                <div>
                   <div className="flex items-center gap-2">
                     <span className="font-bold text-gray-800">{item.exerciseType}</span>
                     <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-medium">
                       {item.reps} reps
                     </span>
                   </div>
                   <p className="text-xs text-gray-500 mt-0.5">Unlocked <span className="font-medium text-gray-700">{item.appName}</span></p>
                </div>
              </div>
              
              <div className="text-right">
                 <div className="text-xs font-bold text-gray-800">{dateStr}</div>
                 <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{timeStr}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryScreen;