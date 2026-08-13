import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from "../../Context/AuthProvider";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const AnalyticsDashboard = ({ refreshTrigger }) => {
  const { token } = useContext(AuthContext);
  const [employeesData, setEmployeesData] = useState([]);
  const [globalStats, setGlobalStats] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('/api/admin/employees', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const employees = res.data;
        // Transform for Bar Chart
        const barData = employees.map(emp => ({
          name: emp.firstName,
          Completed: emp.taskCount.completed,
          Active: emp.taskCount.active,
          Failed: emp.taskCount.failed,
          New: emp.taskCount.newTask,
        })).sort((a, b) => b.Completed - a.Completed); 
        
        setEmployeesData(barData);

        // Calculate Global Totals
        let totals = { Completed: 0, Failed: 0, Active: 0, New: 0 };
        employees.forEach(emp => {
          totals.Completed += emp.taskCount.completed;
          totals.Failed += emp.taskCount.failed;
          totals.Active += emp.taskCount.active;
          totals.New += emp.taskCount.newTask;
        });

        const pieData = Object.keys(totals).map(key => ({
          name: key,
          value: totals[key]
        })).filter(item => item.value > 0);

        setGlobalStats(pieData);

      } catch (error) {
        console.error("Failed to load analytics", error);
      }
    };
    if (token) fetchAnalytics();
  }, [token, refreshTrigger]);

  const COLORS = {
    Completed: '#10B981', // Emerald
    Failed: '#EF4444',    // Red
    Active: '#EAB308',    // Yellow
    New: '#3B82F6'        // Blue
  };

  const generatePDFReport = async () => {
    try {
      const loadingToast = toast.loading("Compiling PDF Data...");
      const doc = new jsPDF();
      
      // Fetch Audit Logs just for the report
      const auditRes = await axios.get('/api/admin/audit', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const auditLogs = auditRes.data.slice(0, 30); // Top 30 recent events
      
      // Top Header Banner
      doc.setFillColor(15, 23, 42); // Slate-900
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.text("Analytics Report", 14, 25);
      
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175); // Gray-400
      doc.text(`System Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 33);

      // Global Summary Box
      let totalCompleted = globalStats.find(s => s.name === "Completed")?.value || 0;
      let totalFailed = globalStats.find(s => s.name === "Failed")?.value || 0;
      let totalActive = globalStats.find(s => s.name === "Active")?.value || 0;
      let totalNew = globalStats.find(s => s.name === "New")?.value || 0;
      let finalTotal = totalCompleted + totalFailed + totalActive + totalNew;

      doc.setFillColor(243, 244, 246); // Gray-100
      doc.rect(14, 50, 182, 30, 'F');
      
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55); // Gray-800
      doc.text("Global Operations Summary", 20, 60);
      
      doc.setFontSize(11);
      doc.setTextColor(75, 85, 99);
      doc.text(`Total Load: ${finalTotal}`, 20, 70);
      doc.text(`Completed: ${totalCompleted}`, 75, 70);
      doc.text(`Failed: ${totalFailed}`, 125, 70);

      // Table Data
      const tableColumn = ["Employee ID", "Completed", "Active", "Failed", "New"];
      const tableRows = [];

      employeesData.forEach(emp => {
        const empData = [
          emp.name,
          emp.Completed.toString(),
          emp.Active.toString(),
          emp.Failed.toString(),
          emp.New.toString()
        ];
        tableRows.push(empData);
      });

      doc.setFontSize(16);
      doc.setTextColor(31, 41, 55);
      doc.text("Individual Performance Ledger", 14, 95);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 100,
        theme: 'grid',
        headStyles: { 
            fillColor: [16, 185, 129], // Emerald-500
            textColor: [255, 255, 255],
            fontSize: 11,
            halign: 'center'
        },
        bodyStyles: {
            fontSize: 10,
            halign: 'center',
            textColor: [55, 65, 81]
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251] // Gray-50
        },
        styles: { cellPadding: 6 }
      });
      
      const finalY = doc.lastAutoTable.finalY || 150;

      // Audit Table Data
      if (auditLogs && auditLogs.length > 0) {
          doc.setFontSize(16);
          doc.setTextColor(31, 41, 55);
          doc.text("Recent System Operations (Audit Trail)", 14, finalY + 15);

          const auditColumn = ["Date", "Action", "Admin / User", "Details"];
          const auditRows = auditLogs.map(log => [
            new Date(log.createdAt).toLocaleDateString() + " " + new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            log.action,
            log.performedByName,
            log.details
          ]);

          autoTable(doc, {
            head: [auditColumn],
            body: auditRows,
            startY: finalY + 20,
            theme: 'grid',
            headStyles: { 
                fillColor: [59, 130, 246], // Blue-500
                textColor: [255, 255, 255],
                fontSize: 10
            },
            bodyStyles: { fontSize: 8, textColor: [75, 85, 99] },
            styles: { cellPadding: 4 }
          });
      }
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text("TeamPulse - Confidential", 14, 285);
        doc.text(`Page ${i} of ${pageCount}`, 180, 285);
      }

      doc.save("Enterprise_Performance_Report.pdf");
      toast.success("PDF Report Downloaded Successfully!", { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF", { id: loadingToast });
    }
  };

  return (
    <div className="w-full mt-8 bg-white/5 border border-white/10 backdrop-blur-md p-6 lg:p-8 rounded-2xl shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Intelligence & Analytics
        </h2>
        <button 
          onClick={generatePDFReport}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 py-2.5 px-6 rounded-xl font-bold text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Download PDF Report
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[350px]">
        {/* Leaderboard Chart */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-6 text-gray-200">Top Performers Leaderboard</h3>
          <div className="w-full h-64 min-h-[256px]">
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={employeesData.slice(0, 5)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} />
                <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} allowDecimals={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                  contentStyle={{backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff'}}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Completed" stackId="a" fill={COLORS.Completed} radius={[0, 0, 4, 4]} />
                <Bar dataKey="Active" stackId="a" fill={COLORS.Active} />
                <Bar dataKey="Failed" stackId="a" fill={COLORS.Failed} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Distribution Chart */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-6 text-gray-200">Global Task Distribution</h3>
          <div className="w-full h-64 min-h-[256px]">
            {globalStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={256}>
                <PieChart>
                  <Pie
                    data={globalStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {globalStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#CBD5E1'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff'}}
                    itemStyle={{color: '#fff'}}
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
