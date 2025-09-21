import React, { useEffect, useState } from "react";
import UserForm from "./Form";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Edit,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const AdminPage = () => {
  const { logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);


  const [filters, setFilters] = useState({
    search: "",
    gender: "",
    currentState: "",
    preferredState: "",
    designation: "",
    department: "",
    experienceRange: "",
    ctcRange: "",
    companyName: "",
  });

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Fetch users
 const fetchUsers = async () => {
  try {
    setLoading(true);
    setError("");
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URI}/forms?limit=1000`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const usersArray = data.data || [];

    // ✅ Set both at once
    setUsers(usersArray);
    setFilteredUsers(usersArray);

    // ✅ Reset filters explicitly
    setFilters({
      search: "",
      gender: "",
      currentState: "",
      preferredState: "",
      designation: "",
      department: "",
      experienceRange: "",
      ctcRange: "",
      companyName: "",
    });
  } catch (err) {
    console.error("Fetch error:", err);
    setError("Error fetching user data: " + err.message);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchUsers();
  }, []);

  // Apply filters
  const applyFilters = (userList, currentFilters) => {
    let filtered = [...userList];

    // Search
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          (user.firstName &&
            user.firstName.toLowerCase().includes(searchTerm)) ||
          (user.lastName && user.lastName.toLowerCase().includes(searchTerm)) ||
          (user.mailId && user.mailId.toLowerCase().includes(searchTerm)) ||
          (user.contactNo && user.contactNo.includes(searchTerm)) ||
          (user.currentEmployer &&
            user.currentEmployer.toLowerCase().includes(searchTerm)) ||
          (user.designation &&
            user.designation.toLowerCase().includes(searchTerm))
      );
    }

    // Gender
    if (currentFilters.gender) {
      filtered = filtered.filter(
        (user) => user.gender === currentFilters.gender
      );
    }

    // Current/Preferred state
    if (currentFilters.currentState) {
      filtered = filtered.filter(
        (user) =>
          user.currentState &&
          user.currentState
            .toLowerCase()
            .includes(currentFilters.currentState.toLowerCase())
      );
    }
    if (currentFilters.preferredState) {
      filtered = filtered.filter(
        (user) =>
          user.preferredState &&
          user.preferredState
            .toLowerCase()
            .includes(currentFilters.preferredState.toLowerCase())
      );
    }

    // Designation/Department
    if (currentFilters.designation) {
      filtered = filtered.filter(
        (user) =>
          user.designation &&
          user.designation
            .toLowerCase()
            .includes(currentFilters.designation.toLowerCase())
      );
    }
    if (currentFilters.department) {
      filtered = filtered.filter(
        (user) =>
          user.department &&
          user.department
            .toLowerCase()
            .includes(currentFilters.department.toLowerCase())
      );
    }

    // Company Name filter
    if (currentFilters.companyName) {
      filtered = filtered.filter(
        (user) =>
          user.currentEmployer &&
          user.currentEmployer
            .toLowerCase()
            .includes(currentFilters.companyName.toLowerCase())
      );
    }

    // Experience
    if (currentFilters.experienceRange) {
      filtered = filtered.filter((user) => {
        const exp = parseFloat(user.totalExperience) || 0;
        switch (currentFilters.experienceRange) {
          case "0-2":
            return exp >= 0 && exp <= 2;
          case "3-5":
            return exp >= 3 && exp <= 5;
          case "6-10":
            return exp >= 6 && exp <= 10;
          case "10+":
            return exp > 10;
          default:
            return true;
        }
      });
    }

    // CTC
    if (currentFilters.ctcRange) {
      filtered = filtered.filter((user) => {
        const ctc = parseFloat(user.ctcInLakhs) || 0;
        switch (currentFilters.ctcRange) {
          case "0-5":
            return ctc >= 0 && ctc <= 5;
          case "5-10":
            return ctc > 5 && ctc <= 10;
          case "10-15":
            return ctc > 10 && ctc <= 15;
          case "15+":
            return ctc > 15;
          default:
            return true;
        }
      });
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    applyFilters(users, newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      search: "",
      gender: "",
      currentState: "",
      preferredState: "",
      designation: "",
      department: "",
      experienceRange: "",
      ctcRange: "",
      companyName: "",
    };
    setFilters(emptyFilters);
    setFilteredUsers(users);
    setCurrentPage(1);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };


  // Fixed Excel export
 // Fixed Excel export with current filters
const handleExportExcel = async () => {
  try {
    // Build query params from filters state
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URI}/forms/download/export-excel?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export error:", err);
    alert("Failed to export Excel file: " + err.message);
  }
};


  // Handle form success (for both add and edit)
  const handleFormSuccess = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedUser(null);
    fetchUsers(); // Refresh the data
  };

  // Handle edit button click
  const handleEditClick = (user) => {
    console.log("Edit user data:", user); // Debug log
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B2951]"></div>
        <span className="ml-2 text-[#1B2951]">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 m-4">
        <p className="font-medium text-sm">Error loading data</p>
        <p className="text-xs">{error}</p>
        <button
          onClick={fetchUsers}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3 lg:p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        {/* Header */}
        <div className="px-3 sm:px-4 lg:px-6 py-3 border-b border-gray-200 bg-[#1B2951]">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-white truncate">
                Admin Management Dashboard
              </h1>
              <p className="text-[#B99D54] text-xs sm:text-sm mt-0.5">
                Total: {filteredUsers.length} users{" "}
                {filteredUsers.length !== users.length &&
                  `(filtered from ${users.length})`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 py-2 bg-[#B99D54] text-white rounded text-sm hover:bg-[#B99D54]/90 transition-colors flex items-center justify-center gap-1 w-full sm:w-auto"
              >
                <Plus className="h-3 w-3" />
                <span className="hidden xs:inline">Add User</span>
                <span className="xs:hidden">Add</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-1 w-full sm:w-auto"
              >
                <FileSpreadsheet className="h-3 w-3" />
                <span className="hidden xs:inline">Export Excel</span>
                <span className="xs:hidden">Export</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-1 w-full sm:w-auto"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden xs:inline">Logout</span>
                <span className="xs:hidden">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-2 sm:p-3 border-b border-gray-200 bg-gray-50">
          {/* Primary Filters - Always Visible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 sm:top-3 h-3 w-3 text-gray-500" />
              <input
                type="text"
                placeholder="Search name, email, phone..."
                className="pl-7 pr-2 py-2 sm:py-1.5 border border-gray-300 rounded text-sm w-full focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            {/* Gender */}
            <select
              className="px-2 py-2 sm:py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.gender}
              onChange={(e) => handleFilterChange("gender", e.target.value)}
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            {/* Experience Range */}
            <select
              className="px-2 py-2 sm:py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.experienceRange}
              onChange={(e) =>
                handleFilterChange("experienceRange", e.target.value)
              }
            >
              <option value="">All Experience</option>
              <option value="0-2">0-2 years</option>
              <option value="3-5">3-5 years</option>
              <option value="6-10">6-10 years</option>
              <option value="10+">10+ years</option>
            </select>

            {/* CTC Range */}
            <select
              className="px-2 py-2 sm:py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.ctcRange}
              onChange={(e) => handleFilterChange("ctcRange", e.target.value)}
            >
              <option value="">All CTC</option>
              <option value="0-5">0-5 Lakhs</option>
              <option value="5-10">5-10 Lakhs</option>
              <option value="10-15">10-15 Lakhs</option>
              <option value="15+">15+ Lakhs</option>
            </select>
          </div>

          {/* Secondary Filters - Collapsible on Mobile */}
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Current State */}
            <input
              type="text"
              placeholder="Current state"
              className="px-2 py-2 sm:py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.currentState}
              onChange={(e) =>
                handleFilterChange("currentState", e.target.value)
              }
            />

            {/* Preferred State */}
            <input
              type="text"
              placeholder="Preferred state"
              className="px-2 py-2 sm:py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.preferredState}
              onChange={(e) =>
                handleFilterChange("preferredState", e.target.value)
              }
            />

            {/* Designation */}
            <input
              type="text"
              placeholder="Designation"
              className="px-2 py-2 sm:py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.designation}
              onChange={(e) =>
                handleFilterChange("designation", e.target.value)
              }
            />

            {/* Department */}
            <input
              type="text"
              placeholder="Department"
              className="px-2 py-2 sm:py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.department}
              onChange={(e) => handleFilterChange("department", e.target.value)}
            />

            {/* Company Name */}
            <input
              type="text"
              placeholder="Company name"
              className="px-2 py-2 sm:py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.companyName}
              onChange={(e) => handleFilterChange("companyName", e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <button
              onClick={clearFilters}
              className="px-3 py-2 sm:py-1.5 text-[#1B2951] hover:text-[#B99D54] hover:bg-gray-100 rounded text-sm transition-colors w-full sm:w-auto"
            >
              Clear Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-3 py-2 sm:py-1.5 bg-[#1B2951] text-white rounded text-sm hover:bg-[#1B2951]/90 transition-colors flex items-center justify-center gap-1 w-full sm:w-auto"
            >
              <RefreshCw className="h-3 w-3" />t
              
              Refresh Data
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#1B2951]">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Personal Details
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Location
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Employment
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Experience
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Comments
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentUsers.map((user, index) => (
                <tr
                  key={user._id || `user-${index}`}
                  className={`hover:bg-gray-50 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="px-3 py-2">
                    <div className="text-sm font-medium text-[#1B2951]">
                      {`${user.firstName || ""} ${user.middleName || ""} ${
                        user.lastName || ""
                      }`.trim()}
                    </div>
                    <div className="text-sm text-[#1B2951]">{user.gender}</div>
                    <div className="text-sm text-[#1B2951] font-medium">
                      DOB: {formatDate(user.dateOfBirth)}
                    </div>
                    <div className="text-sm text-[#1B2951] font-medium">
                      Father's name: {user.fatherName}
                    </div>
                    <div className="text-sm text-[#1B2951] font-medium">
                      PAN no: {user.panNo}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm text-[#1B2951] font-medium">
                      {user.contactNo}
                    </div>
                    {user.alternateContactNo && (
                      <div className="text-sm text-[#1B2951]">
                        Alt: {user.alternateContactNo}
                      </div>
                    )}
                    <div className="text-sm text-[#1B2951] font-medium">
                      {user.mailId}
                    </div>
                    {user.alternateMailId && (
                      <div className="text-sm text-[#1B2951]">
                        Alt: {user.alternateMailId}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm text-[#1B2951]">
                      <span className="font-medium">Current:</span>{" "}
                      {user.currentCity}, {user.currentState}
                    </div>
                    <div className="text-sm text-[#1B2951]">
                      <span className="font-medium">Preferred:</span>{" "}
                      {user.preferredCity}, {user.preferredState}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm font-medium text-[#1B2951]">
                      Current Employer: {user.currentEmployer}
                    </div>
                    <div className="text-sm text-[#1B2951]">
                      Designation: {user.designation}
                    </div>
                    <div className="text-sm text-[#1B2951]">
                      Department: {user.department}
                    </div>
                    <div className="text-sm text-[#1B2951]">
                      CTC: ₹{user.ctcInLakhs} L
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#B99D54]/20 text-[#1B2951] border border-[#B99D54]/30">
                        {user.totalExperience} yrs
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="">
                      <ul className="list-disc pl-4">
                        {[user.comment1, user.comment2, user.comment3].map(
                          (comment, idx) =>
                            comment && (
                              <li key={idx} className="text-sm text-[#1B2951]">
                                {comment}
                              </li>
                            )
                        )}
                      </ul>
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                        title="Edit User"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {currentUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                No users found matching your criteria.
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredUsers.length)} of{" "}
                {filteredUsers.length} results
                <span className="ml-2 text-xs text-gray-500">
                  (Page {currentPage} of {totalPages})
                </span>
              </div>
              <div className="flex items-center space-x-1">
                {/* Previous button */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {generatePageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                      {page === "..." ? (
                        <span className="px-2 py-1.5 text-sm text-gray-500">
                          ...
                        </span>
                      ) : (
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded text-sm ${
                            currentPage === page
                              ? "bg-[#1B2951] text-white"
                              : "border border-gray-300 hover:bg-gray-100 text-[#1B2951]"
                          }`}
                        >
                          {page}
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Next button */}
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[95vh] overflow-y-auto p-4 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>

            <UserForm
              mode="add"
              onClose={() => setIsAddModalOpen(false)}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[95vh] overflow-y-auto p-4 relative">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedUser(null);
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
            <UserForm
              mode="edit"
              initialData={selectedUser}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedUser(null);
              }}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
