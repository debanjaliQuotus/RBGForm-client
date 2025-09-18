import React, { useState, useEffect, useRef, useCallback } from "react";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

// API endpoints for fetching location data
const LOCATION_APIS = {
  // States of India - now using local data
  states: async (query) => {
    if (!query) return [];

    try {
      // Filter states based on query
      const filteredStates = INDIAN_STATES.filter(state =>
        state.toLowerCase().includes(query.toLowerCase())
      );

      // Simulate API delay for consistent UX
      await new Promise(resolve => setTimeout(resolve, 100));

      return filteredStates.slice(0, 10); // Limit to 10 results
    } catch (err) {
      console.error("❌ States filtering failed:", err);
      return [];
    }
  },

  // ✅ Cities (GeoDB API via RapidAPI)
  cities: async (query) => {
    if (!query) return [];
    try {
      const res = await fetch(
        `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?countryIds=IN&namePrefix=${query}&limit=10`,
        {
          headers: {
            "X-RapidAPI-Key": "8acb9381a3mshea3bfd0bb433a6dp197841jsn1a5356656ec7", // 🔑 Replace with your key
            "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
          },
        }
      );

      const { data } = await res.json();
      return data.map((city) => city.name); // ✅ GeoDB uses "name"
    } catch (err) {
      console.error("❌ Cities API failed:", err.message);
      return [];
    }
  },

};

// Enhanced Debounced Autocomplete with API Integration
const DebouncedAutoComplete = ({ name, value, onChange, placeholder, apiType, error, className }) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef(null);

  // Debounced fetch
  const fetchOptions = useCallback(
    debounce(async (searchValue) => {
      if (searchValue && searchValue.length >= 2) {
        setIsLoading(true);
        try {
          const results = await LOCATION_APIS[apiType](searchValue);
          setFilteredOptions(results);
          setIsOpen(results.length > 0);
        } catch (err) {
          console.error("❌ Fetch failed:", err.message);
          setFilteredOptions([]);
          setIsOpen(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setFilteredOptions([]);
        setIsOpen(false);
        setIsLoading(false);
      }
    }, 500),
    [apiType]
  );

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    fetchOptions(inputValue);
  }, [inputValue, fetchOptions]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange({ target: { name, value: newValue } });
  };

  const handleOptionSelect = (option) => {
    setInputValue(option);
    onChange({ target: { name, value: option } });
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        name={name}
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
        onFocus={() => {
          if (filteredOptions.length > 0) {
            setIsOpen(true);
          }
        }}
      />

      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={index}
                onClick={() => handleOptionSelect(option)}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
              >
                {option}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500 text-sm">No options found</div>
          )}
        </div>
      )}
    </div>
  );
};

const UserForm = ({ initialData = null, mode = "add", onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    uploadedBy: "",
    firstName: "",
    middleName: "",
    lastName: "",
    contactNo: "",
    alternateContactNo: "",
    mailId: "",
    alternateMailId: "",
    fatherName: "",
    panNo: "",
    dateOfBirth: "",
    dobDay: "",
    dobMonth: "",
    dobYear: "",
    gender: "",
    currentState: "",
    currentCity: "",
    preferredState: "",
    preferredCity: "",
    currentEmployer: "",
    designation: "",
    department: "",
    ctcInLakhs: "",
    totalExperience: "",
    comments: [""],
    comment1: "",
    comment2: "",
    comment3: ""
  });

  const [pdfFile, setPdfFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Fill form if editing
  useEffect(() => {
    if (initialData) {
      // Parse dateOfBirth if it exists
      const updatedData = { ...initialData };
      if (initialData.dateOfBirth) {
        const dateParts = initialData.dateOfBirth.split('-');
        if (dateParts.length === 3) {
          updatedData.dobYear = dateParts[0];
          updatedData.dobMonth = dateParts[1];
          updatedData.dobDay = dateParts[2];
        }
      }
      setFormData(prev => ({ ...prev, ...updatedData }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // If DOB fields are being updated, combine them into single dateOfBirth
      if (["dobDay", "dobMonth", "dobYear"].includes(name)) {
        const { dobDay, dobMonth, dobYear } = updated;
        if (dobDay && dobMonth && dobYear) {
          updated.dateOfBirth = `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}`;
        }
      }

      return updated;
    });
  };

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key !== "comments" && key !== "dobDay" && key !== "dobMonth" && key !== "dobYear") {
          data.append(key, formData[key]);
        }
      });

      // Handle comments separately
      if (formData.comments) {
        formData.comments.forEach((comment, index) => {
          if (comment.trim()) {
            data.append(`comment${index + 1}`, comment);
          }
        });
      }

      if (pdfFile) data.append("pdfFile", pdfFile);

      const url =
        mode === "edit"
          ? `http://localhost:5000/forms/${initialData.id|| initialData._id}`
          : "http://localhost:5000/forms";

      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, { method, body: data });

      if (!response.ok) {
        const errorData = await response.json();
        // ✅ Show backend message in alert if it exists
      if (errorData.message) {
        alert(errorData.message);
      }
        throw { response: { data: errorData } };
      }

      alert(mode === "edit" ? "User updated successfully!" : "Form submitted successfully!");
      if (onSuccess) onSuccess(); // callback to refresh table
      if (onClose) onClose(); // close modal
    } catch (error) {
      console.error(error);

      if (error.response && error.response.data) {
        const errorData = error.response.data;
        const backendErrors = {};
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorData.errors.forEach((err) => {
            if (err.field && err.message) {
              backendErrors[err.field] = err.message;
            } else if (err.path && err.path[0] && err.message) {
              backendErrors[err.path[0]] = err.message;
            }
          });
        }
        setErrors(backendErrors);
      } else {
        alert("Error submitting form. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderError = (fieldName) =>
    errors[fieldName] ? (
      <p className="text-red-600 text-sm mt-1 font-medium">{errors[fieldName]}</p>
    ) : null;

  const handleCommentChange = (index, value) => {
    const newComments = [...(formData.comments || [""])];
    newComments[index] = value;
    setFormData({ ...formData, comments: newComments });
  };

  const addComment = () => {
    if (formData.comments.length < 3) {
      setFormData({
        ...formData,
        comments: [...(formData.comments || []), ""],
      });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-4xl max-h-screen overflow-y-auto">
        <h2 className="text-3xl font-bold mb-8 text-center text-blue-600">
          {mode === "edit" ? "Edit User" : "User Information Form"}
        </h2>

        {/* Personal Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Personal Information</h3>

          {/* Uploaded By */}
          <div className="mb-4">
            <label className="block text-gray-600 text-sm font-medium mb-1">Uploaded By</label>
            <input
              type="text"
              name="uploadedBy"
              placeholder="Uploaded By"
              value={formData.uploadedBy}
              onChange={handleChange}
              className={`p-3 text-sm border rounded-md w-full ${errors.uploadedBy ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            />
            {renderError('uploadedBy')}
          </div>

          {/* Name Fields in One Row */}
          <div className="mb-4">
            <label className="block text-gray-600 text-sm font-medium mb-1">Full Name</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`p-3 text-sm border rounded-md w-full ${errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {renderError('firstName')}
              </div>
              <div>
                <input
                  type="text"
                  name="middleName"
                  placeholder="Middle Name"
                  value={formData.middleName}
                  onChange={handleChange}
                  className={`p-3 text-sm border rounded-md w-full ${errors.middleName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {renderError('middleName')}
              </div>
              <div>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`p-3 text-sm border rounded-md w-full ${errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {renderError('lastName')}
              </div>
            </div>
          </div>

          {/* Father Name */}
          <div className="mb-4">
            <label className="block text-gray-600 text-sm font-medium mb-1">Father's Name</label>
            <input
              type="text"
              name="fatherName"
              placeholder="Father Name"
              value={formData.fatherName}
              onChange={handleChange}
              className={`p-3 text-sm border rounded-md w-full ${errors.fatherName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            />
            {renderError('fatherName')}
          </div>

          {/* Date of Birth */}
          <div className="mb-4">
            <label className="block text-gray-600 text-sm font-medium mb-1">Date of Birth</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <select
                  name="dobDay"
                  value={formData.dobDay || ""}
                  onChange={handleChange}
                  className={`p-3 text-sm border rounded-md w-full ${errors.dateOfBirth ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                >
                  <option value="">DD</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  name="dobMonth"
                  value={formData.dobMonth || ""}
                  onChange={handleChange}
                  className={`p-3 text-sm border rounded-md w-full ${errors.dateOfBirth ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                >
                  <option value="">MM</option>
                  <option value="01">Jan</option>
                  <option value="02">Feb</option>
                  <option value="03">Mar</option>
                  <option value="04">Apr</option>
                  <option value="05">May</option>
                  <option value="06">Jun</option>
                  <option value="07">Jul</option>
                  <option value="08">Aug</option>
                  <option value="09">Sep</option>
                  <option value="10">Oct</option>
                  <option value="11">Nov</option>
                  <option value="12">Dec</option>
                </select>
              </div>
              <div>
                <select
                  name="dobYear"
                  value={formData.dobYear || ""}
                  onChange={handleChange}
                  className={`p-3 text-sm border rounded-md w-full ${errors.dateOfBirth ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                >
                  <option value="">YYYY</option>
                  {Array.from({ length: 100 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            {renderError('dateOfBirth')}
          </div>

          {/* Gender and PAN in same row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`p-3 text-sm border rounded-md w-full ${errors.gender ? "border-red-500 bg-red-50" : "border-gray-300"}`}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {renderError("gender")}
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">PAN No</label>
              <input
                type="text"
                name="panNo"
                placeholder="ABCDE1234F"
                value={formData.panNo}
                onChange={handleChange}
                className={`p-3 text-sm border rounded-md uppercase w-full ${errors.panNo ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {renderError('panNo')}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Contact Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Numbers */}
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Contact No</label>
              <input
                type="text"
                name="contactNo"
                placeholder="Contact No"
                value={formData.contactNo}
                onChange={handleChange}
                className={`p-3 text-sm border rounded-md w-full ${errors.contactNo ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {renderError('contactNo')}
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Alternate Contact</label>
              <input
                type="text"
                name="alternateContactNo"
                placeholder="Alternate Contact"
                value={formData.alternateContactNo}
                onChange={handleChange}
                className={`p-3 text-sm border rounded-md w-full ${errors.alternateContactNo ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {renderError('alternateContactNo')}
            </div>

            {/* Email Addresses */}
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="mailId"
                placeholder="Email"
                value={formData.mailId}
                onChange={handleChange}
                className={`p-3 text-sm border rounded-md w-full ${errors.mailId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {renderError('mailId')}
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Alternate Email</label>
              <input
                type="email"
                name="alternateMailId"
                placeholder="Alternate Email"
                value={formData.alternateMailId}
                onChange={handleChange}
                className={`p-3 text-sm border rounded-md w-full ${errors.alternateMailId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {renderError('alternateMailId')}
            </div>

            {/* Current Location */}
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Current State</label>
              <DebouncedAutoComplete
                name="currentState"
                value={formData.currentState}
                onChange={handleChange}
                placeholder="Current State"
                apiType="states"
                error={errors.currentState}
                className={`p-3 text-sm border rounded-md w-full ${errors.currentState ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {renderError('currentState')}
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Current City</label>
              <DebouncedAutoComplete
                name="currentCity"
                value={formData.currentCity}
                onChange={handleChange}
                placeholder="Current City"
                apiType="cities"
                error={errors.currentCity}
                className={`p-3 text-sm border rounded-md w-full ${errors.currentCity ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {renderError('currentCity')}
            </div>

            {/* Preferred Location */}
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Preferred State</label>
              <DebouncedAutoComplete
                name="preferredState"
                value={formData.preferredState}
                onChange={handleChange}
                placeholder="Preferred State"
                apiType="states"
                error={errors.preferredState}
                className={`p-3 text-sm border rounded-md w-full ${errors.preferredState ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {renderError('preferredState')}
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Preferred City</label>
              <DebouncedAutoComplete
                name="preferredCity"
                value={formData.preferredCity}
                onChange={handleChange}
                placeholder="Preferred City"
                apiType="cities"
                error={errors.preferredCity}
                className={`p-3 text-sm border rounded-md w-full ${errors.preferredCity ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {renderError('preferredCity')}
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Professional Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Current Employer</label>
              <input
                type="text"
                name="currentEmployer"
                placeholder="Current Employer"
                value={formData.currentEmployer}
                onChange={handleChange}
                className={`p-3 text-sm border rounded-md w-full ${errors.currentEmployer ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {renderError('currentEmployer')}
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Designation</label>
              <input
                type="text"
                name="designation"
                placeholder="Designation"
                value={formData.designation}
                onChange={handleChange}
                className={`p-3 text-sm border rounded-md w-full ${errors.designation ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {renderError('designation')}
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`p-3 text-sm border rounded-md w-full ${errors.department ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              >
                <option value="">Select Department</option>
                <option value="Agency">Agency</option>
                <option value="Banca">Banca</option>
                <option value="Direct">Direct</option>
                <option value="Training">Training</option>
                <option value="Operations / Back-office">Operations / Back-office</option>
                <option value="Underwriting">Underwriting</option>
                <option value="NPS">NPS</option>
                <option value="Strategy">Strategy</option>
                <option value="Product Development">Product Development</option>
                <option value="Claims Management">Claims Management</option>
                <option value="Retention">Retention</option>
                <option value="Actuarial">Actuarial</option>
                <option value="Broking Channel">Broking Channel</option>
                <option value="SME Agency">SME Agency</option>
                <option value="Defence">Defence</option>
                <option value="Reinsurance">Reinsurance</option>
                <option value="Online/Digital Sales">Online/Digital Sales</option>
                <option value="Telly - VRM">Telly - VRM</option>
                <option value="Policy Servicing / Customer Service">Policy Servicing / Customer Service</option>
                <option value="Compliance & Legal">Compliance & Legal</option>
                <option value="Risk Management">Risk Management</option>
                <option value="Regulatory compliance">Regulatory compliance</option>
                <option value="Finance & Accounts">Finance & Accounts</option>
                <option value="Investments / Fund Management">Investments / Fund Management</option>
                <option value="Human Resources (HR)">Human Resources (HR)</option>
                <option value="IT / Technology">IT / Technology</option>
                <option value="Administration & Facilities">Administration & Facilities</option>
                <option value="Marketing & Brand Management">Marketing & Brand Management</option>
                <option value="Analytics & Business Intelligence">Analytics & Business Intelligence</option>
                <option value="Partnership & Alliances Acquisition">Partnership & Alliances Acquisition</option>
                <option value="Corporate Sales">Corporate Sales</option>
                <option value="OEM">OEM</option>
                <option value="Group Insurance">Group Insurance</option>
                <option value="Other">Other</option>
              </select>

              {/* If "Other" is selected, show input box */}
              {formData.department === "Other" && (
                <input
                  type="text"
                  name="customDepartment"
                  placeholder="Enter department"
                  value={formData.customDepartment || ""}
                  onChange={handleChange}
                  className="mt-2 p-3 text-sm border rounded-md w-full border-gray-300"
                />
              )}

              {renderError('department')}
            </div>


            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">CTC (in Lakhs)</label>
              <input
                type="number"
                step="0.01"
                name="ctcInLakhs"
                placeholder="CTC in Lakhs"
                value={formData.ctcInLakhs}
                onChange={handleChange}
                className={`p-3 text-sm border rounded-md w-full ${errors.ctcInLakhs ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {renderError('ctcInLakhs')}
            </div>

            <div className="md:col-span-1">
              <label className="block text-gray-600 text-sm font-medium mb-1">Total Experience (Years)</label>
              <input
                type="number"
                step="1"
                name="totalExperience"
                placeholder="Total Experience (Years)"
                value={formData.totalExperience}
                onChange={handleChange}
                min={5}
                max={35}
                className={`p-3 text-sm border rounded-md w-full ${errors.totalExperience ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
              />
              {renderError('totalExperience')}
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Comments</h3>

          {formData.comments.map((comment, index) => (
            <div key={index} className="mb-3">
              <input
                type="text"
                placeholder={`Comment ${index + 1} (max 500 characters)`}
                value={comment}
                onChange={(e) => handleCommentChange(index, e.target.value)}
                className={`p-3 border rounded-md w-full text-sm ${errors[`comment${index + 1}`]
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300"
                  }`}
                maxLength="500"
              />
              {renderError(`comment${index + 1}`)}
            </div>
          ))}

          {formData.comments.length < 3 && (
            <button
              type="button"
              onClick={addComment}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              + Add Comment
            </button>
          )}
        </div>

        {/* File Upload */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Upload PDF</h3>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="p-3 text-sm border border-gray-300 rounded-md w-full 
      file:mr-4 file:py-2 file:px-4 file:rounded-md 
      file:border-0 file:bg-blue-50 file:text-blue-600 
      hover:file:bg-blue-100 file:cursor-pointer"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-end">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 px-6 py-3 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className={`text-white px-6 py-3 rounded-md font-medium text-sm transition-colors ${isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {isSubmitting
              ? "Saving..."
              : mode === "edit"
                ? "Save Changes"
                : "Submit Form"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserForm;