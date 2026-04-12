import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../Context/AuthProvider";
import EditEmployeeModal from "./EditEmployeeModal";

const AllTask = ({ refreshTrigger }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [localRefresh, setLocalRefresh] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get("/api/admin/employees", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setEmployees(response.data);
      } catch (error) {
        console.error("Failed to fetch employees", error);
      }
    };
    
    if (token) {
      fetchEmployees();
    }
  }, [token, refreshTrigger, localRefresh]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = employees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(employees.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div id="AllTask" className="bg-white/5 border border-white/10 backdrop-blur-md p-6 rounded-2xl mt-8 shadow-xl">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Employee Task Overview</h2>
      </div>

      <div className="bg-white/10 py-3 px-6 flex justify-between rounded-t-xl text-gray-200 border-b border-white/10 shadow-sm backdrop-blur-lg">
        <h2 className="text-sm font-semibold uppercase tracking-wider w-1/5">Employee Details</h2>
        <h3 className="text-sm font-semibold uppercase tracking-wider w-1/5 text-center text-blue-400">New Task</h3>
        <h5 className="text-sm font-semibold uppercase tracking-wider w-1/5 text-center text-yellow-400">Active</h5>
        <h5 className="text-sm font-semibold uppercase tracking-wider w-1/5 text-center text-emerald-400">Completed</h5>
        <h5 className="text-sm font-semibold uppercase tracking-wider w-1/5 text-center text-red-500">Failed</h5>
      </div>

      <div className="flex flex-col gap-3 mt-3 min-h-[400px]">
        {currentEmployees.map((elem, idx) => {
          return (
            <div 
              key={`${currentPage}-${idx}`} 
              onClick={() => setSelectedEmployee(elem)}
              className="group bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-white/10 transition-all duration-300 py-4 px-6 flex justify-between items-center rounded-xl shadow-sm hover:shadow-md slide-in-up cursor-pointer"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="w-1/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                  {elem.firstName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-medium text-white group-hover:text-emerald-400 transition-colors uppercase">{elem.firstName}</h2>
                  <p className="text-[10px] text-gray-400 font-bold tracking-widest">{elem.team || 'General'}</p>
                </div>
              </div>
              <div className="w-1/5 flex justify-center">
                <span className="px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-sm shadow-[0_0_10px_rgba(59,130,246,0.1)] group-hover:bg-blue-500/20 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all">
                  {elem.taskCount?.newTask || 0}
                </span>
              </div>
              <div className="w-1/5 flex justify-center">
                <span className="px-4 py-1.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-bold text-sm shadow-[0_0_10px_rgba(234,179,8,0.1)] group-hover:bg-yellow-500/20 group-hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all">
                  {elem.taskCount?.active || 0}
                </span>
              </div>
              <div className="w-1/5 flex justify-center">
                <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-sm shadow-[0_0_10px_rgba(16,185,129,0.1)] group-hover:bg-emerald-500/20 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all">
                  {elem.taskCount?.completed || 0}
                </span>
              </div>
              <div className="w-1/5 flex justify-center">
                <span className="px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-sm shadow-[0_0_10px_rgba(239,68,68,0.1)] group-hover:bg-red-500/20 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">
                  {elem.taskCount?.failed || 0}
                </span>
              </div>
            </div>
          );
        })}

        {employees.length === 0 && (
          <div className="text-center py-10 text-gray-400 bg-white/5 rounded-xl border border-white/10 my-auto">
            <svg className="mx-auto h-12 w-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-lg font-medium">No employees found.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6 pt-4 border-t border-white/10">
          <button 
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            Prev
          </button>
          
          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => paginate(i + 1)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                  currentPage === i + 1 
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-transparent' 
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10 hover:border-emerald-500/50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button 
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {selectedEmployee && (
        <EditEmployeeModal 
          employee={selectedEmployee} 
          onClose={() => setSelectedEmployee(null)} 
          onSuccess={() => { setSelectedEmployee(null); setLocalRefresh(!localRefresh); }} 
        />
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .slide-in-up {
          opacity: 0;
          animation: slideInUp 0.5s ease-out forwards;
        }
      `}} />
    </div>
  );
};

export default AllTask;
