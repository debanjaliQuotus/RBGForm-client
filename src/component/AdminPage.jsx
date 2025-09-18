import React, { useEffect, useState } from "react";
import UserForm from "./Form";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";

const AdminPage = () => {
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
    });

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:5000/forms");
            if (!response.ok) throw new Error("Failed to fetch users");
            const data = await response.json();
            setUsers(data.data || []);
            setFilteredUsers(data.data || []);
        } catch (err) {
            console.error(err);
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
                    user.firstName?.toLowerCase().includes(searchTerm) ||
                    user.lastName?.toLowerCase().includes(searchTerm) ||
                    user.mailId?.toLowerCase().includes(searchTerm) ||
                    user.contactNo?.includes(searchTerm) ||
                    user.currentEmployer?.toLowerCase().includes(searchTerm) ||
                    user.designation?.toLowerCase().includes(searchTerm)
            );
        }

        // Gender
        if (currentFilters.gender) {
            filtered = filtered.filter((user) => user.gender === currentFilters.gender);
        }

        // Current/Preferred state
        if (currentFilters.currentState) {
            filtered = filtered.filter((user) =>
                user.currentState?.toLowerCase().includes(currentFilters.currentState.toLowerCase())
            );
        }
        if (currentFilters.preferredState) {
            filtered = filtered.filter((user) =>
                user.preferredState?.toLowerCase().includes(currentFilters.preferredState.toLowerCase())
            );
        }

        // Designation/Department
        if (currentFilters.designation) {
            filtered = filtered.filter((user) =>
                user.designation?.toLowerCase().includes(currentFilters.designation.toLowerCase())
            );
        }
        if (currentFilters.department) {
            filtered = filtered.filter((user) =>
                user.department?.toLowerCase().includes(currentFilters.department.toLowerCase())
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
        };
        setFilters(emptyFilters);
        setFilteredUsers(users);
        setCurrentPage(1);
    };

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

    // Delete
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await fetch(`http://localhost:5000/forms/${id}`, { method: "DELETE" });
            const updatedUsers = users.filter((u) => u._id !== id);
            setUsers(updatedUsers);
            setFilteredUsers(updatedUsers);
        } catch (err) {
            console.error(err);
        }
    };

    // Download PDF
    const downloadPDF = async (fileName, userName) => {
        const url = `http://localhost:5000/uploads/${fileName}`;
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${userName || "user"}_resume.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        } catch (err) {
            console.error("Download failed:", err);
        }
    };

    // Export Excel
    const handleExportExcel = async () => {
        try {
            const response = await fetch("http://localhost:5000/forms/download/export-excel");
            if (!response.ok) throw new Error("Failed to download Excel file");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "users.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert("Failed to export Excel");
        }
    };

    if (loading)
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );

    if (error)
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <p className="font-medium">Error loading data</p>
                <p className="text-sm">{error}</p>
                <button
                    onClick={fetchUsers}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        );

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-700">Admin Panel</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
                    >
                        + Add User
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        Export Excel
                    </button>
                    <button
                        onClick={fetchUsers}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                        Refresh Data
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 bg-gray-50 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                    type="text"
                    placeholder="Search name, email, phone..."
                    className="px-3 py-2 border rounded w-full"
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                />
                <select
                    className="px-3 py-2 border rounded"
                    value={filters.gender}
                    onChange={(e) => handleFilterChange("gender", e.target.value)}
                >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
                <input
                    type="text"
                    placeholder="Current State"
                    className="px-3 py-2 border rounded"
                    value={filters.currentState}
                    onChange={(e) => handleFilterChange("currentState", e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Preferred State"
                    className="px-3 py-2 border rounded"
                    value={filters.preferredState}
                    onChange={(e) => handleFilterChange("preferredState", e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Designation"
                    className="px-3 py-2 border rounded"
                    value={filters.designation}
                    onChange={(e) => handleFilterChange("designation", e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Department"
                    className="px-3 py-2 border rounded"
                    value={filters.department}
                    onChange={(e) => handleFilterChange("department", e.target.value)}
                />
                <select
                    className="px-3 py-2 border rounded"
                    value={filters.experienceRange}
                    onChange={(e) => handleFilterChange("experienceRange", e.target.value)}
                >
                    <option value="">All Experience</option>
                    <option value="0-2">0-2 yrs</option>
                    <option value="3-5">3-5 yrs</option>
                    <option value="6-10">6-10 yrs</option>
                    <option value="10+">10+ yrs</option>
                </select>
                <select
                    className="px-3 py-2 border rounded"
                    value={filters.ctcRange}
                    onChange={(e) => handleFilterChange("ctcRange", e.target.value)}
                >
                    <option value="">All CTC</option>
                    <option value="0-5">0-5 L</option>
                    <option value="5-10">5-10 L</option>
                    <option value="10-15">10-15 L</option>
                    <option value="15+">15+ L</option>
                </select>

                <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-gray-200 rounded mt-2"
                >
                    Clear Filters
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Location
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Employment
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Experience
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                CTC
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentUsers.length > 0 ? (
                            currentUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {`${user.firstName || ""} ${user.middleName || ""} ${user.lastName || ""}`.trim()}
                                        </div>
                                        <div className="text-sm text-gray-500">{user.gender}</div>
                                        <div className="text-sm text-gray-500">DOB: {user.dateOfBirth}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.contactNo}</div>
                                        <div className="text-sm text-gray-500">{user.mailId}</div>
                                        {user.alternateContactNo && (
                                            <div className="text-sm text-gray-500">Alt: {user.alternateContactNo}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            Current: {user.currentCity}, {user.currentState}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Preferred: {user.preferredCity}, {user.preferredState}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{user.currentEmployer}</div>
                                        <div className="text-sm text-gray-500">{user.designation}</div>
                                        <div className="text-sm text-gray-500">{user.department}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {user.totalExperience} yrs
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            ₹{user.ctcInLakhs} L
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                                        <button
                                            onClick={() =>
                                                downloadPDF(user.pdfFile?.filename, `${user.firstName}_${user.lastName}`)
                                            }
                                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                            title="Download PDF"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setIsEditModalOpen(true);
                                            }}
                                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user._id)}
                                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="p-4 text-center">
                                    No users found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} results
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border rounded disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            const pageNum = i + 1;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-2 rounded ${currentPage === pageNum ? "bg-blue-600 text-white" : "border border-gray-300 hover:bg-gray-50"}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border rounded disabled:opacity-50"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
                    <UserForm
                        closeModal={() => {
                            setIsAddModalOpen(false);
                            fetchUsers();
                        }}
                    />
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
                    <UserForm
                        user={selectedUser}
                        closeModal={() => {
                            setIsEditModalOpen(false);
                            setSelectedUser(null);
                            fetchUsers();
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default AdminPage;
