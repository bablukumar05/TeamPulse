import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PersonalAnalytics = ({ taskCount }) => {
    const data = [
        { name: 'Completed', value: taskCount.completed },
        { name: 'Active', value: taskCount.active },
        { name: 'Failed', value: taskCount.failed },
        { name: 'New Tasks', value: taskCount.newTask }
    ].filter(item => item.value > 0);

    const COLORS = {
        'Completed': '#10B981',
        'Active': '#EAB308',
        'Failed': '#EF4444',
        'New Tasks': '#3B82F6'
    };

    return (
        <div className="w-full mt-6 bg-[#161a23]/60 border border-white/10 rounded-[30px] p-6 lg:p-10 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 w-full text-center md:text-left">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent mb-2">My Productivity Overview</h3>
                <p className="text-gray-400 text-sm mb-6">A visual breakdown of your current task distribution and historical completion rate.</p>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-center shadow-inner hover:bg-emerald-500/20 transition-colors">
                        <p className="text-emerald-400 text-3xl font-black">{taskCount.completed}</p>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Completed</p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl text-center shadow-inner hover:bg-yellow-500/20 transition-colors">
                        <p className="text-yellow-400 text-3xl font-black">{taskCount.active}</p>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">In Progress</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-center shadow-inner hover:bg-blue-500/20 transition-colors">
                        <p className="text-blue-400 text-3xl font-black">{taskCount.newTask}</p>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">New Tasks</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-center shadow-inner hover:bg-red-500/20 transition-colors">
                        <p className="text-red-400 text-3xl font-black">{taskCount.failed}</p>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Failed</p>
                    </div>
                </div>
            </div>
            
            <div className="w-full md:w-[320px] h-[250px]">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#CBD5E1'} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'}}
                                itemStyle={{color: '#fff', fontWeight: 'bold'}}
                            />
                            <Legend iconType="circle" verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 border border-dashed border-gray-600 rounded-2xl bg-white/5">
                        No active data
                    </div>
                )}
            </div>
        </div>
    );
};

export default PersonalAnalytics;
