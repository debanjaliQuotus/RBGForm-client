import React, { useEffect, useState } from "react";
import UserForm from "./Form";
import { Download } from "lucide-react";

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);

    // ✅ Fetch all users from backend
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:5000/forms");
            const data = await response.json();
            setUsers(data.data || []); // FIXED to match backend
        } catch (error) {
            console.log("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // ✅ Delete user
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            await fetch(`http://localhost:5000/forms/${id}`, {
                method: "DELETE",
            });
            setUsers(users.filter((u) => u._id !== id));
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    // ✅ Open add modal
    const openAddModal = () => {
        setSelectedUser(null);
        setIsAddModalOpen(true);
    };

    // ✅ Open edit modal
    const openEditModal = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleExportExcel = async () => {
        try {
            const response = await fetch("http://localhost:5000/forms/download/export-excel", {
                method: "GET",
            });

            if (!response.ok) {
                throw new Error("Failed to download Excel file");
            }

            // Convert response to Blob
            const blob = await response.blob();

            // Create a temporary download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "users.xlsx"; // File name
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.log("Error exporting Excel:", error);
            alert("Failed to export Excel");
        }
    };

    const downloadPDF = async (fileName, userName) => {
        const url = `http://localhost:5000/uploads/${fileName}`;
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${userName || 'user'}_resume.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href); // clean up
        } catch (err) {
            console.error('Download failed:', err);
        }
    };



    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-700">Admin Panel</h1>
                <button
                    onClick={openAddModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
                >
                    + Add User
                </button>
            </div>

            {/* Users Table (same as SubAdminPage) */}
            <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTC</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="p-4 text-center">
                                    Loading...
                                </td>
                            </tr>
                        ) : users.length > 0 ? (
                            users.map((user) => (
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
                                            {user.totalExperience} years
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            ₹{user.ctcInLakhs} L
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                                        <button
                                            onClick={() => downloadPDF(user.pdfFile?.filename, `${user.firstName}_${user.lastName}`)}
                                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                            title="Download PDF"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => openEditModal(user)}
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

            {/* ✅ Add User Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-11/12 max-w-4xl p-6 relative max-h-[80vh] overflow-y-auto">
                        <button
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
                        >
                            ✖
                        </button>
                        <h2 className="text-xl font-bold mb-4">Add User</h2>
                        <UserForm />
                    </div>
                </div>
            )}

            {/* ✅ Edit User Modal */}
            {isEditModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-11/12 max-w-4xl p-6 relative max-h-[80vh] overflow-y-auto">
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
                        >
                            ✖
                        </button>
                        <h2 className="text-xl font-bold mb-4">Edit User</h2>
                        <UserForm initialData={selectedUser} isEdit={true} />
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">

                <button
                    onClick={handleExportExcel}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    Export to Excel
                </button>
            </div>

        </div>
    );
};

export default AdminPage;
