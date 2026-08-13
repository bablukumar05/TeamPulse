import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const FocusMode = ({ tasks }) => {
  const [selectedTask, setSelectedTask] = useState("");
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  
  const activeTasks = tasks?.filter(t => t.status === 'Active' || t.status === 'New') || [];

  useEffect(() => {
    let interval = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      clearInterval(interval);
      
      // Trigger modern gamification toast/animation
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#1A1A1A] shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-emerald-500/50 p-4 border border-white/10`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5 text-4xl">
                🍅
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-bold text-white">Focus Session Complete!</p>
                <p className="mt-1 text-xs text-gray-400">Great job staying focused. +20 XP awarded.</p>
              </div>
            </div>
          </div>
        </div>
      ), { duration: 6000 });
      
      setTimeLeft(1500);
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    if (!selectedTask) {
        toast.error("Please select a task to focus on first.");
        return;
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(1500);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate circular progress dashoffset
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / 1500) * circumference;

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      <div className="absolute -inset-1 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          
        {/* Timer Visualization */}
        <div className="relative flex items-center justify-center">
            <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r={radius} className="stroke-gray-700/50" strokeWidth="8" fill="none" />
                <circle 
                    cx="80" 
                    cy="80" 
                    r={radius} 
                    className="stroke-red-500 transition-all duration-1000 ease-linear" 
                    strokeWidth="8" 
                    fill="none" 
                    strokeLinecap="round"
                    style={{ strokeDasharray: circumference, strokeDashoffset }}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-bold font-mono tracking-wider bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">{formatTime(timeLeft)}</span>
            </div>
        </div>

        {/* Controls */}
        <div className="flex-1 w-full">
            <h3 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Focus Mode (Pomodoro)
            </h3>
            
            <div className="mb-6">
                <select 
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    disabled={isActive}
                    className="text-sm py-3 px-4 w-full rounded-xl outline-none bg-black/20 border border-white/10 hover:border-red-500/50 focus:border-red-500 text-white transition-all duration-300 shadow-inner appearance-none disabled:opacity-50"
                >
                    <option value="" className="bg-gray-800 text-gray-400">Select a task to focus on...</option>
                    {activeTasks.map(task => (
                        <option key={task._id} value={task._id} className="bg-gray-800 text-white">{task.title}</option>
                    ))}
                </select>
            </div>

            <div className="flex gap-4">
                <button 
                    onClick={toggleTimer}
                    className={`flex-1 py-3 px-6 rounded-xl text-sm font-bold tracking-wider text-white shadow-lg transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2 ${isActive ? 'bg-gradient-to-r from-yellow-500 to-orange-600 shadow-orange-500/30' : 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/30'}`}
                >
                    {isActive ? (
                        <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> PAUSE</>
                    ) : (
                        <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> START FOCUS</>
                    )}
                </button>
                <button 
                    onClick={resetTimer}
                    disabled={!isActive && timeLeft === 1500}
                    className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-400 hover:text-white disabled:opacity-50 disabled:hover:bg-white/5 disabled:hover:text-gray-400"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FocusMode;
