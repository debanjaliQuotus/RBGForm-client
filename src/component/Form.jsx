import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";

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
const DebouncedAutoComplete = ({ name, value, onChange, placeholder, apiType, className }) => {
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
    onChange(newValue);
  };

  const handleOptionSelect = (option) => {
    setInputValue(option);
    onChange(option);
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
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-5 w-5 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={index}
                onClick={() => handleOptionSelect(option)}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-colors duration-150"
              >
                {option}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500 text-sm">No options found</div>
          )}
        </div>
      )}
    </div>
  );
};

const UserForm = ({ initialData = null, mode = "add", onClose, onSuccess }) => {
  const [pdfFile, setPdfFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
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
      customDepartment: "",
      ctcInLakhs: "",
      totalExperience: "",
      comment1: "",
      comment2: "",
      comment3: ""
    }
  });

  const watchDobFields = watch(["dobDay", "dobMonth", "dobYear"]);
  const watchDepartment = watch("department");

  // ✅ Fill form if editing
  useEffect(() => {
    if (initialData) {
      const updatedData = { ...initialData };
      if (initialData.dateOfBirth) {
        const dateParts = initialData.dateOfBirth.split('-');
        if (dateParts.length === 3) {
          updatedData.dobYear = dateParts[0];
          updatedData.dobMonth = dateParts[1];
          updatedData.dobDay = dateParts[2];
        }
      }
      reset(updatedData);
    }
  }, [initialData, reset]);

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData();

      // Combine DOB fields
      if (data.dobDay && data.dobMonth && data.dobYear) {
        data.dateOfBirth = `${data.dobYear}-${data.dobMonth.padStart(2, "0")}-${data.dobDay.padStart(2, "0")}`;
      }

      Object.keys(data).forEach((key) => {
        if (!["dobDay", "dobMonth", "dobYear"].includes(key)) {
          if (data[key]) {
            formData.append(key, data[key]);
          }
        }
      });

      if (pdfFile) formData.append("pdfFile", pdfFile);

      const url =
        mode === "edit"
          ? `http://localhost:5000/forms/${initialData.id || initialData._id}`
          : "http://localhost:5000/forms";

      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, { method, body: formData });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message) {
          alert(errorData.message);
        }
        throw { response: { data: errorData } };
      }

      alert(mode === "edit" ? "User updated successfully!" : "Form submitted successfully!");
      if (onSuccess) onSuccess();
      if (onClose) onClose();
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

  const inputClass = "w-full px-4 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white text-gray-700 placeholder-gray-400";
  const selectClass = "w-full px-4 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white text-gray-700";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden mb-2">
          <div className="bg-blue-900 px-6 py-2" style={{ backgroundColor: '#1B2951' }}>
            <h1 className="text-2xl font-bold text-white mb-2">
              {mode === "edit" ? "Edit User Information" : "User Information Form"}
            </h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          {/* Personal Information Section */}
          <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-2" style={{ backgroundColor: '#B99D54' }}>
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Personal Information
              </h2>
            </div>
            <div className="p-8 space-y-3">
              {/* Uploaded By */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Uploaded By</label>
                <Controller
                  name="uploadedBy"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Enter uploaded by"
                      className={inputClass}
                    />
                  )}
                />
                {renderError('uploadedBy')}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Controller
                      name="firstName"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="First Name"
                          className={inputClass}
                        />
                      )}
                    />
                    {renderError('firstName')}
                  </div>
                  <div>
                    <Controller
                      name="middleName"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="Middle Name"
                          className={inputClass}
                        />
                      )}
                    />
                    {renderError('middleName')}
                  </div>
                  <div>
                    <Controller
                      name="lastName"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="Last Name"
                          className={inputClass}
                        />
                      )}
                    />
                    {renderError('lastName')}
                  </div>
                </div>
              </div>

              {/* Father's Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Father's Name</label>
                <Controller
                  name="fatherName"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Enter father's name"
                      className={inputClass}
                    />
                  )}
                />
                {renderError('fatherName')}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                <div className="grid grid-cols-3 gap-4">
                  <Controller
                    name="dobDay"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className={selectClass}>
                        <option value="">Day</option>
                        {Array.from({ length: 31 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <Controller
                    name="dobMonth"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className={selectClass}>
                        <option value="">Month</option>
                        <option value="01">January</option>
                        <option value="02">February</option>
                        <option value="03">March</option>
                        <option value="04">April</option>
                        <option value="05">May</option>
                        <option value="06">June</option>
                        <option value="07">July</option>
                        <option value="08">August</option>
                        <option value="09">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                    )}
                  />
                  <Controller
                    name="dobYear"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className={selectClass}>
                        <option value="">Year</option>
                        {Array.from({ length: 100 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  />
                </div>
                {renderError('dateOfBirth')}
              </div>

              {/* Gender and PAN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className={selectClass}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    )}
                  />
                  {renderError('gender')}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">PAN Number</label>
                  <Controller
                    name="panNo"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="ABCDE1234F"
                        className={`${inputClass} uppercase`}
                      />
                    )}
                  />
                  {renderError('panNo')}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-white  shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-2" style={{ backgroundColor: '#B99D54' }}>
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Contact Information
              </h2>
            </div>
            <div className="p-8 space-y-2">
              {/* Contact Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Contact</label>
                  <Controller
                    name="contactNo"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Enter contact number"
                        className={inputClass}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Alternate Contact</label>
                  <Controller
                    name="alternateContactNo"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Enter alternate contact"
                        className={inputClass}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Email Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Email</label>
                  <Controller
                    name="mailId"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="email"
                        placeholder="Enter email address"
                        className={inputClass}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Alternate Email</label>
                  <Controller
                    name="alternateMailId"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="email"
                        placeholder="Enter alternate email"
                        className={inputClass}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Current Location */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Current Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                    <Controller
                      name="currentState"
                      control={control}
                      render={({ field }) => (
                        <DebouncedAutoComplete
                          name="currentState"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select current state"
                          apiType="states"
                          className={inputClass}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <Controller
                      name="currentCity"
                      control={control}
                      render={({ field }) => (
                        <DebouncedAutoComplete
                          name="currentCity"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select current city"
                          apiType="cities"
                          className={inputClass}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Preferred Location */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Preferred Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                    <Controller
                      name="preferredState"
                      control={control}
                      render={({ field }) => (
                        <DebouncedAutoComplete
                          name="preferredState"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select preferred state"
                          apiType="states"
                          className={inputClass}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <Controller
                      name="preferredCity"
                      control={control}
                      render={({ field }) => (
                        <DebouncedAutoComplete
                          name="preferredCity"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select preferred city"
                          apiType="cities"
                          className={inputClass}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information Section */}
          <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-2" style={{ backgroundColor: '#B99D54' }}>
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6.5A2.5 2.5 0 0115.5 17h-11A2.5 2.5 0 012 14.5V8a2 2 0 012-2h2zm4-1a1 1 0 00-1 1v1h2V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Professional Information
              </h2>
            </div>
            <div className="p-8 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Employer</label>
                  <Controller
                    name="currentEmployer"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Enter current employer"
                        className={inputClass}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
                  <Controller
                    name="designation"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Enter designation"
                        className={inputClass}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                  <Controller
                    name="department"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-3">
                        <select {...field} className={selectClass}>
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

                        {watchDepartment === "Other" && (
                          <Controller
                            name="customDepartment"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="text"
                                placeholder="Enter department"
                                className={inputClass}
                              />
                            )}
                          />
                        )}
                      </div>
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">CTC (in Lakhs)</label>
                  <Controller
                    name="ctcInLakhs"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="Enter CTC"
                        className={inputClass}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Total Experience (Years)</label>
                  <Controller
                    name="totalExperience"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        step="0.1"
                        placeholder="Enter experience"
                        min={5}
                        max={35}
                        className={inputClass}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-2" style={{ backgroundColor: '#B99D54' }}>
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Comments
              </h2>
            </div>
            <div className="p-8 space-y-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Comment 1</label>
                <Controller
                  name="comment1"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Enter comment 1 (max 500 characters)"
                      className={inputClass}
                      maxLength="500"
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Comment 2</label>
                <Controller
                  name="comment2"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Enter comment 2 (max 500 characters)"
                      className={inputClass}
                      maxLength="500"
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Comment 3</label>
                <Controller
                  name="comment3"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Enter comment 3 (max 500 characters)"
                      className={inputClass}
                      maxLength="500"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="bg-white  shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-2" style={{ backgroundColor: '#B99D54' }}>
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Upload Document
              </h2>
            </div>
            <div className="p-2">
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-400 transition-colors duration-200">
                <svg
                  className="w-8 h-8 text-gray-400 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />

                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 text-xs text-white font-medium rounded-md transition-all duration-200"
                  style={{ backgroundColor: "#1B2951" }}
                >
                  Choose PDF
                </label>

                {pdfFile && (
                  <p className="mt-2 text-xs text-gray-600">Selected: {pdfFile.name}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">PDF only, max 10MB</p>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pb-8">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2 text-white ${isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "shadow-lg hover:shadow-xl"
                }`}
              style={!isSubmitting ? { backgroundColor: '#1B2951' } : {}}
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>
                {isSubmitting
                  ? "Processing..."
                  : mode === "edit"
                    ? "Update Information"
                    : "Submit Form"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;