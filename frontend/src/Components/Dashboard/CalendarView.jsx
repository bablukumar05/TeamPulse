import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from "../../Context/AuthProvider";

const CalendarView = ({ embeddedTasks }) => {
    const { token, authUser } = useContext(AuthContext);
    const [tasks, setTasks] = useState(embeddedTasks || []);
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const daysList = [];
    for (let i = 0; i < firstDay; i++) {
        daysList.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        daysList.push(i);
    }

    useEffect(() => {
        if (embeddedTasks) {
            setTasks(embeddedTasks);
        } else if (token && (authUser?.role === 'admin' || authUser?.role === 'manager')) {
            const fetchAdminTasks = async () => {
                try {
                    const res = await axios.get('/api/admin/tasks/all', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setTasks(res.data);
                } catch (err) {
                    console.error("Failed to fetch calendar tasks", err);
                }
            };
            fetchAdminTasks();
        }
    }, [embeddedTasks, token, authUser]);

    const getTasksForDay = (day) => {
        if (!day || !tasks || tasks.length === 0) return [];
        const checkDate = new Date(year, month, day);
        // Correctly shift timezone offset to prevent day hopping
        const localDate = new Date(checkDate.getTime() - (checkDate.getTimezoneOffset() * 60000));
        const dateStr = localDate.toISOString().split('T')[0];

        return tasks.filter(t => {
             if(!t.date) return false;
             try {
                const taskDate = new Date(t.date);
                const localTaskDate = new Date(taskDate.getTime() - (taskDate.getTimezoneOffset() * 60000));
                return localTaskDate.toISOString().split('T')[0] === dateStr;
             } catch(e) {
                return false;
             }
        });
    };

    const getStatusColor = (status) => {
        if(status === 'Completed') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if(status === 'Failed') return 'bg-red-500/20 text-red-400 border-red-500/30';
        if(status === 'Active') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    };

    return (
        <div className="w-full mt-7 bg-[#161a23]/60 border border-white/10 rounded-[30px] p-6 lg:p-10 backdrop-blur-xl font-sans shadow-2xl">
            <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 tracking-widest uppercase shadow-black/50 drop-shadow-lg">
                    {monthNames[month]} {year}
                </h2>
                <div className="flex gap-4">
                    <button onClick={prevMonth} className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all duration-300 border border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] hover:-translate-x-1 font-semibold tracking-wider text-sm hover:shadow-blue-500/20">PREV</button>
                    <button onClick={nextMonth} className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all duration-300 border border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] hover:translate-x-1 font-semibold tracking-wider text-sm hover:shadow-blue-500/20">NEXT</button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-4 lg:gap-6">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs lg:text-sm font-black text-gray-500 uppercase tracking-widest pb-4 border-b border-white/10">
                        {day}
                    </div>
                ))}

                {daysList.map((day, idx) => {
                    const dayTasks = getTasksForDay(day);
                    return (
                        <div key={idx} className={`relative min-h-[120px] lg:min-h-[140px] rounded-2xl border transition-all duration-300 ${day ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-xl hover:border-white/20' : 'border-transparent bg-transparent'}`}>
                            {day && (
                                <div className="p-3 lg:p-4 h-full flex flex-col">
                                    <div className="text-right text-gray-500 text-sm font-bold opacity-70 mb-3">{day}</div>
                                    <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
                                        {dayTasks.map((t, i) => (
                                            <div key={i} className={`text-[10px] lg:text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border whitespace-nowrap overflow-hidden text-ellipsis shadow-md transition-transform hover:scale-[1.02] cursor-default ${getStatusColor(t.status)}`}>
                                                {t.title}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;
