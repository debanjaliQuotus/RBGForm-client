import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const SubAdminPage = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        gender: '',
        currentState: '',
        preferredState: '',
        designation: '',
        department: '',
        experienceRange: '',
        ctcRange: ''
    });

    // Fetch all users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/forms');

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const result = await response.json();

            // Access the actual array inside result.data
            const usersArray = result.data || [];

            setUsers(usersArray);
            setFilteredUsers(usersArray);
        } catch (err) {
            setError('Error fetching user data: ' + err.message);
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };



    // Apply filters
    const applyFilters = (userList, currentFilters) => {
        let filtered = [...userList];

        // Search filter
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            filtered = filtered.filter(user =>
                user.firstName?.toLowerCase().includes(searchTerm) ||
                user.lastName?.toLowerCase().includes(searchTerm) ||
                user.mailId?.toLowerCase().includes(searchTerm) ||
                user.contactNo?.includes(searchTerm) ||
                user.currentEmployer?.toLowerCase().includes(searchTerm) ||
                user.designation?.toLowerCase().includes(searchTerm)
            );
        }

        // Gender filter
        if (currentFilters.gender) {
            filtered = filtered.filter(user => user.gender === currentFilters.gender);
        }

        // State filters
        if (currentFilters.currentState) {
            filtered = filtered.filter(user =>
                user.currentState?.toLowerCase().includes(currentFilters.currentState.toLowerCase())
            );
        }

        if (currentFilters.preferredState) {
            filtered = filtered.filter(user =>
                user.preferredState?.toLowerCase().includes(currentFilters.preferredState.toLowerCase())
            );
        }

        // Designation filter
        if (currentFilters.designation) {
            filtered = filtered.filter(user =>
                user.designation?.toLowerCase().includes(currentFilters.designation.toLowerCase())
            );
        }

        // Department filter
        if (currentFilters.department) {
            filtered = filtered.filter(user =>
                user.department?.toLowerCase().includes(currentFilters.department.toLowerCase())
            );
        }

        // Experience range filter
        if (currentFilters.experienceRange) {
            filtered = filtered.filter(user => {
                const exp = parseFloat(user.totalExperience) || 0;
                switch (currentFilters.experienceRange) {
                    case '0-2': return exp >= 0 && exp <= 2;
                    case '3-5': return exp >= 3 && exp <= 5;
                    case '6-10': return exp >= 6 && exp <= 10;
                    case '10+': return exp > 10;
                    default: return true;
                }
            });
        }

        // CTC range filter
        if (currentFilters.ctcRange) {
            filtered = filtered.filter(user => {
                const ctc = parseFloat(user.ctcInLakhs) || 0;
                switch (currentFilters.ctcRange) {
                    case '0-5': return ctc >= 0 && ctc <= 5;
                    case '5-10': return ctc > 5 && ctc <= 10;
                    case '10-15': return ctc > 10 && ctc <= 15;
                    case '15+': return ctc > 15;
                    default: return true;
                }
            });
        }

        setFilteredUsers(filtered);
        setCurrentPage(1); // Reset to first page when filtering
    };

    // Handle filter changes
    const handleFilterChange = (filterName, value) => {
        const newFilters = { ...filters, [filterName]: value };
        setFilters(newFilters);
        applyFilters(users, newFilters);
    };

    // Clear all filters
    const clearFilters = () => {
        const emptyFilters = {
            search: '',
            gender: '',
            currentState: '',
            preferredState: '',
            designation: '',
            department: '',
            experienceRange: '',
            ctcRange: ''
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

    useEffect(() => {
        fetchUsers();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
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
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-lg">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-800">User Submissions</h1>
                    <p className="text-gray-600 mt-1">
                        Total: {filteredUsers.length} users {filteredUsers.length !== users.length && `(filtered from ${users.length})`}
                    </p>
                </div>

                {/* Filters */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search name, email, phone..."
                                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>

                        {/* Gender */}
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={filters.gender}
                            onChange={(e) => handleFilterChange('gender', e.target.value)}
                        >
                            <option value="">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>

                        {/* Current State */}
                        <input
                            type="text"
                            placeholder="Filter by current state"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={filters.currentState}
                            onChange={(e) => handleFilterChange('currentState', e.target.value)}
                        />

                        {/* Preferred State */}
                        <input
                            type="text"
                            placeholder="Filter by preferred state"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={filters.preferredState}
                            onChange={(e) => handleFilterChange('preferredState', e.target.value)}
                        />

                        {/* Designation */}
                        <input
                            type="text"
                            placeholder="Filter by designation"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={filters.designation}
                            onChange={(e) => handleFilterChange('designation', e.target.value)}
                        />

                        {/* Department */}
                        <input
                            type="text"
                            placeholder="Filter by department"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={filters.department}
                            onChange={(e) => handleFilterChange('department', e.target.value)}
                        />

                        {/* Experience Range */}
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={filters.experienceRange}
                            onChange={(e) => handleFilterChange('experienceRange', e.target.value)}
                        >
                            <option value="">All Experience</option>
                            <option value="0-2">0-2 years</option>
                            <option value="3-5">3-5 years</option>
                            <option value="6-10">6-10 years</option>
                            <option value="10+">10+ years</option>
                        </select>

                        {/* CTC Range */}
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={filters.ctcRange}
                            onChange={(e) => handleFilterChange('ctcRange', e.target.value)}
                        >
                            <option value="">All CTC</option>
                            <option value="0-5">0-5 Lakhs</option>
                            <option value="5-10">5-10 Lakhs</option>
                            <option value="10-15">10-15 Lakhs</option>
                            <option value="15+">15+ Lakhs</option>
                        </select>
                    </div>

                    <div className="mt-4 flex justify-between items-center">
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Clear Filters
                        </button>
                        <button
                            onClick={fetchUsers}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Refresh Data
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTC</th>

                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {`${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`.trim()}
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
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {user.totalExperience} years
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            ₹{user.ctcInLakhs} L
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {currentUsers.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No users found matching your criteria.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} results
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`px-3 py-2 rounded-lg ${currentPage === pageNum
                                                    ? 'bg-blue-600 text-white'
                                                    : 'border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubAdminPage;
