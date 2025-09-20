import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

// --- START: New Data for Companies ---
const INSURANCE_COMPANIES = [
  // Life Insurance
  "Acko Life Insurance Ltd",
  "Aditya Birla Sun Life Insurance Co. Ltd",
  "Ageas Federal Life Insurance Company Limited",
  "Aviva Life Insurance Company India Limited",
  "Bajaj Allianz Life Insurance Co. Ltd.",
  "Bandhan Life Insurance (formerly Aegon Life)",
  "Canara HSBC Life Insurance Company Limited",
  "Edelweiss Life Insurance Company Limited",
  "Future Generali India Life Insurance Company limited",
  "Go Digit Life Insurance Limited",
  "HDFC Life Insurance Co. Ltd",
  "ICICI Prudential Life Insurance Co. Ltd",
  "IndiaFirst Life Insurance Company Limited",
  "Kotak Mahindra life Insurance Co. Ltd",
  "Life Insurance Corporation of India",
  "PNB MetLife India Insurance Company Limited",
  "Reliance Nippon Life Insurance Company Limited",
  "Sahara India Life Insurance Company Limited",
  "SBI Life Insurance Co. Ltd",
  "Shriram Life Insurance Company Limited",
  "Star Union Dai-ichi Life Insurance Company Limited",
  "TATA AIA Life Insurance Co. Ltd",
  // General Insurance
  "Acko General Insurance Ltd",
  "Agriculture Insurance Company of India Limited",
  "Bajaj Allianz General Insurance",
  "Cholamandalam MS General Insurance Company Limited",
  "ECGC Limited",
  "Go Digit General Insurance Limited",
  "HDFC ERGO General Insurance Company Limited",
  "ICICI Lombard General Insurance",
  "IFFCO TOKIO General Insurance Company Limited",
  "Kotak Mahindra General Insurance",
  "Liberty General Insurance Limited",
  "Magma HDI General Insurance Company Limited",
  "National Insurance Company Limited",
  "Navi General Insurance Limited",
  "New India Assurance",
  "Raheja QBE General Insurance Co. Ltd.",
  "Reliance General Insurance",
  "Royal Sundaram General Insurance",
  "SBI General Insurance",
  "Shriram General Insurance",
  "Tata AIG General Insurance",
  "The Oriental Insurance Co",
  "United India Insurance Co",
  "Universal Sompo General Insurance",
  "Zuno General Insurance (formerly Edelweiss)",
  // Health Insurance
  "Aditya Birla Health Insurance",
  "Care Health Insurance",
  "ManipalCigna Health Insurance",
  "Niva Bupa Health Insurance",
  "Star Health & Allied Insurance",
  "Galaxy Health Insurance Company Limited",
  "Narayana Health Insurance Ltd",
  // Insurance Broker
  "Marsh India Insurance Brokers",
  "Mahindra Insurance Brokers Ltd",
  "Policybazaar Insurance Brokers Pvt. Ltd",
  "Howden Insurance Brokers India Pvt. Ltd",
];

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
  "Puducherry",
];

// API endpoints for fetching location data
const LOCATION_APIS = {
  // States of India - now using local data
  states: async (query) => {
    if (!query) return [];
    try {
      const filteredStates = INDIAN_STATES.filter((state) =>
        state.toLowerCase().includes(query.toLowerCase())
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      return filteredStates.slice(0, 10);
    } catch (err) {
      console.error("❌ States filtering failed:", err);
      return [];
    }
  },

  // Cities (GeoDB API via RapidAPI)
  cities: async (query) => {
    if (!query) return [];
    try {
      const res = await fetch(
        `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?countryIds=IN&namePrefix=${query}&limit=10`,
        {
          headers: {
            "X-RapidAPI-Key":
              "8acb9381a3mshea3bfd0bb433a6dp197841jsn1a5356656ec7", // 🔑 Replace with your key
            "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
          },
        }
      );

      if (!res.ok) {
        throw new Error(`API responded with status: ${res.status}`);
      }

      const responseData = await res.json();

      // Handle different possible response structures
      const data = responseData.data || responseData.cities || responseData.results || [];

      // Ensure data is an array before mapping
      if (!Array.isArray(data)) {
        console.warn("❌ Cities API returned non-array data:", data);
        return [];
      }

      return data.map((city) => {
        // Handle different city object structures
        if (typeof city === 'string') {
          return city;
        }
        return city.name || city.city || city.cityName || city.label || 'Unknown City';
      }).filter(Boolean); // Remove any undefined/null values
    } catch (err) {
      console.error("❌ Cities API failed:", err.message);
      return [];
    }
  },

  // Companies - using local data
  companies: async (query) => {
    if (!query) return [];
    try {
      const filteredCompanies = INSURANCE_COMPANIES.filter((company) =>
        company.toLowerCase().includes(query.toLowerCase())
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      return filteredCompanies.slice(0, 10);
    } catch (err) {
      console.error("❌ Companies filtering failed:", err);
      return [];
    }
  },
};

// Enhanced Debounced Autocomplete with API Integration
const DebouncedAutoComplete = ({
  name,
  value,
  onChange,
  placeholder,
  apiType,
  className,
}) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);

  const fetchOptions = useCallback(
    debounce(async (searchValue) => {
      if (searchValue && searchValue.length >= 1) { // Changed to 1 for better UX
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
    }, 300), // Reduced debounce time for faster feedback
    [apiType]
  );

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    fetchOptions(inputValue);
  }, [inputValue, fetchOptions]);

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
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        name={name}
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
        onFocus={() => {
            // Re-check options on focus if input has value
            if(inputValue) fetchOptions(inputValue);
        }}
        autoComplete="off"
      />
      {isLoading && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-5 w-5 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
        </div>
      )}
      {isOpen && (
        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
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
            <div className="px-4 py-3 text-gray-500 text-sm">
              No options found
            </div>
          )}
        </div>
      )}
    </div>
  );
};
const UserForm = ({ initialData = null, mode = "add", onClose, onSuccess }) => {
  const [documentFile, setdocumentFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState([""]);

  const addComment = () => setComments([...comments, ""]);
  const updateComment = (index, value) =>
    setComments(comments.map((c, i) => (i === index ? value : c)));
  const removeComment = (index) =>
    setComments(comments.filter((_, i) => i !== index));

  const { control, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      uploadedBy: "",
      uploadDate: "",
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
    },
  });

  const watchDepartment = watch("department");
  const mailIdValue = watch("mailId"); // Watch the primary email field
  const [ctcDisplay, setCtcDisplay] = useState("");
  const ctcValue = watch("ctcInLakhs");
  useEffect(() => {
    setCtcDisplay(ctcValue || "");
  }, [ctcValue]);

  // Effect to set the upload date automatically
  useEffect(() => {
    if (mode === "add") {
      const currentDate = new Date().toISOString().split("T")[0];
      setValue("uploadDate", currentDate);
    }
  }, [mode, setValue]);

  // Effect to sync the primary email to the 'uploadedBy' field
  useEffect(() => {
    if (mode === "add") {
      setValue("uploadedBy", mailIdValue || "");
    }
  }, [mailIdValue, mode, setValue]);

  // Fill form if editing
  useEffect(() => {
    if (initialData) {
      const updatedData = { ...initialData };
      if (initialData.dateOfBirth) {
        const dateParts = initialData.dateOfBirth.split("-");
        if (dateParts.length === 3) {
          updatedData.dobYear = dateParts[0];
          updatedData.dobMonth = dateParts[1];
          updatedData.dobDay = dateParts[2];
        }
      }
      reset(updatedData);
      // Set comments from existing data
      const existingComments = [
        initialData.comment1,
        initialData.comment2,
        initialData.comment3,
      ].filter((c) => c && c.trim());
      setComments(existingComments.length > 0 ? existingComments : [""]);
    }
  }, [initialData, reset]);

  const handleFileChange = (e) => {
    setdocumentFile(e.target.files[0]);
  };

  const onSubmit = async (data) => {
    const newErrors = {};

    // --- Validation Check ---
    if (
      data.contactNo &&
      data.alternateContactNo &&
      data.contactNo === data.alternateContactNo
    ) {
      newErrors.alternateContactNo =
        "Alternate contact cannot be the same as primary.";
    }
    if (
      data.mailId &&
      data.alternateMailId &&
      data.mailId === data.alternateMailId
    ) {
      newErrors.alternateMailId =
        "Alternate email cannot be the same as primary.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Stop submission if there are errors
    }

    setIsSubmitting(true);
    setErrors({}); // Clear previous errors

    try {
      const formData = new FormData();
      if (data.dobDay && data.dobMonth && data.dobYear) {
        data.dateOfBirth = `${data.dobYear}-${data.dobMonth.padStart(
          2,
          "0"
        )}-${data.dobDay.padStart(2, "0")}`;
      }

      // Debug: Log what data is being sent
      console.log("Form data being sent:", data);

      // Define required fields that should always be sent
      const requiredFields = [
        'firstName', 'lastName', 'contactNo', 'mailId', 'gender',
        'currentState', 'currentCity', 'preferredState', 'preferredCity',
        'currentEmployer', 'designation', 'department', 'ctcInLakhs', 'totalExperience'
      ];

      // Fields that should NOT be sent to backend (system fields)
      const excludedFields = [
        'dobDay', 'dobMonth', 'dobYear', '_id', 'id', 'dateOfUpload',
        'createdAt', 'updatedAt', '__v', 'permanentDetails', 'comments'
      ];

      Object.keys(data).forEach((key) => {
        if (!excludedFields.includes(key)) {
          // Always send required fields, even if empty
          if (requiredFields.includes(key) || (data[key] !== undefined && data[key] !== null && data[key] !== "")) {
            formData.append(key, data[key] || "");
          }
        }
      });

      // Debug: Log FormData contents
      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      if (documentFile) formData.append("pdfFile", documentFile);

      // Validate that we have a valid ID for edit mode
      let url;
      if (mode === "edit") {
        const formId = initialData?.id || initialData?._id;
        if (!formId) {
          alert("Error: No valid form ID found for editing. Please try again.");
          setIsSubmitting(false);
          return;
        }

        url = `${import.meta.env.VITE_BACKEND_URI}/forms/${formId}`;
      } else {
        url = `${import.meta.env.VITE_BACKEND_URI}/forms`;
      }

      const method = mode === "edit" ? "PUT" : "POST";
      const response = await fetch(url, { method, body: formData });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend error response:", errorData);

        // Handle validation errors specifically
        if (errorData.errors && Array.isArray(errorData.errors)) {
          console.error("Detailed validation errors:", errorData.errors);
          const validationErrors = errorData.errors.map(err => `${err.field}: ${err.message}`).join('\n');
          alert(`Validation Error:\n${validationErrors}`);
        } else {
          alert(errorData.message || "An error occurred.");
        }
        throw { response: { data: errorData } };
      }

      const responseData = await response.json();
      const formId = responseData.id || responseData._id;

      // Submit comments for new forms
      if (mode === "add") {
        for (const comment of comments) {
          if (comment.trim()) {
            await fetch(
              `${import.meta.env.VITE_BACKEND_URI}/forms/${formId}/comments`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comment }),
              }
            );
          }
        }
      }

      alert(
        mode === "edit"
          ? "User updated successfully!"
          : "Form submitted successfully!"
      );
      if (onSuccess) onSuccess();
      if (onClose) onClose();
      reset();
      setComments([""]);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
        const { errors: backendErrorsData } = error.response.data;
        const backendErrors = {};
        if (Array.isArray(backendErrorsData)) {
          backendErrorsData.forEach((err) => {
            if (err.field) {
              backendErrors[err.field] = err.message;
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
      <p className="text-red-600 text-sm mt-1 font-medium">
        {errors[fieldName]}
      </p>
    ) : null;

  const inputClass =
    "w-full px-4 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white text-gray-700 placeholder-gray-400";
  const selectClass =
    "w-full px-4 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white text-gray-700";

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: "#f0f2f8" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-sm border border-gray-200 mb-2">
          <div className="px-6 py-2" style={{ backgroundColor: "#1B2951" }}>
            <h1 className="text-2xl font-bold text-white mb-2">
              {mode === "edit"
                ? "Edit User Information"
                : "User Information Form"}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          {/* Personal Information Section */}
          <div className="bg-white shadow-sm border border-gray-200">
            <div className="px-6 py-2" style={{ backgroundColor: "#B99D54" }}>
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                Personal Information
              </h2>
            </div>
            <div className="p-8 space-y-3">
              {/* Uploaded By and Upload Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Uploaded By
                  </label>
                  <Controller
                    name="uploadedBy"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="email"
                        placeholder="Auto-populated from Primary Email"
                        className={`${inputClass} bg-gray-50`}
                        readOnly
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload Date
                  </label>
                  <Controller
                    name="uploadDate"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="date"
                        className={`${inputClass} bg-gray-50`}
                        readOnly
                      />
                    )}
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
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
                    {renderError("firstName")}
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
                    {renderError("middleName")}
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
                    {renderError("lastName")}
                  </div>
                </div>
              </div>

              {/* Other Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Father's Name
                  </label>
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
                  {renderError("fatherName")}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    PAN Number
                  </label>
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
                  {renderError("panNo")}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <Controller
                      name="dobDay"
                      control={control}
                      render={({ field }) => (
                        <select {...field} className={selectClass}>
                          <option value="">Day</option>
                          {Array.from({ length: 31 }, (_, i) => (
                            <option
                              key={i + 1}
                              value={String(i + 1).padStart(2, "0")}
                            >
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
                  {renderError("dateOfBirth")}
                </div>
                {/* Gender */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gender
                  </label>
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
                  {renderError("gender")}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-white shadow-sm border border-gray-200">
            <div className="px-6 py-2" style={{ backgroundColor: "#B99D54" }}>
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Contact Information
              </h2>
            </div>
            <div className="p-8 space-y-4">
              {/* Contact Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Primary Contact
                  </label>
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
                  {renderError("contactNo")}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Alternate Contact
                  </label>
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
                  {renderError("alternateContactNo")}
                </div>
              </div>

              {/* Email Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Primary Email
                  </label>
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
                  {renderError("mailId")}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Alternate Email
                  </label>
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
                  {renderError("alternateMailId")}
                </div>
              </div>

              {/* Current Location */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 pt-2">
                  Current Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State
                    </label>
                    <Controller
                      name="currentState"
                      control={control}
                      render={({ field }) => (
                        <DebouncedAutoComplete
                          {...field}
                          placeholder="Select current state"
                          apiType="states"
                          className={inputClass}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City
                    </label>
                    <Controller
                      name="currentCity"
                      control={control}
                      render={({ field }) => (
                        <DebouncedAutoComplete
                          {...field}
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
                <h3 className="text-lg font-semibold text-gray-700 mb-10 pt-2">
                  Preferred Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State
                    </label>
                    <Controller
                      name="preferredState"
                      control={control}
                      render={({ field }) => (
                        <DebouncedAutoComplete
                          {...field}
                          placeholder="Select preferred state"
                          apiType="states"
                          className={inputClass}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City
                    </label>
                    <Controller
                      name="preferredCity"
                      control={control}
                      render={({ field }) => (
                        <DebouncedAutoComplete
                          {...field}
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
          <div className="bg-white shadow-sm border border-gray-200">
            <div className="px-6 py-2" style={{ backgroundColor: "#B99D54" }}>
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6.5A2.5 2.5 0 0115.5 17h-11A2.5 2.5 0 012 14.5V8a2 2 0 012-2h2zm4-1a1 1 0 00-1 1v1h2V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Professional Information
              </h2>
            </div>
            <div className="p-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Current Employer
                        </label>
                        {/* --- START: Updated Field --- */}
                        <Controller
                            name="currentEmployer"
                            control={control}
                            render={({ field }) => (
                                <DebouncedAutoComplete
                                    {...field}
                                    placeholder="Start typing an employer name..."
                                    apiType="companies"
                                    className={inputClass}
                                />
                            )}
                        />
                    </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Designation
                  </label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Department
                  </label>
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
                          <option value="Operations / Back-office">
                            Operations / Back-office
                          </option>
                          <option value="Underwriting">Underwriting</option>
                          <option value="NPS">NPS</option>
                          <option value="Strategy">Strategy</option>
                          <option value="Product Development">
                            Product Development
                          </option>
                          <option value="Claims Management">
                            Claims Management
                          </option>
                          <option value="Retension">Retension</option>
                          <option value="Actuarial">Actuarial</option>
                          <option value="Broking Channel">
                            Broking Channel
                          </option>
                          <option value="SME Agency">SME Agency</option>
                          <option value="Defence">Defence</option>
                          <option value="Reinsurance">Reinsurance</option>
                          <option value="Online/Digital Sales">
                            Online/Digital Sales
                          </option>
                          <option value="Telly - VRM">Telly - VRM</option>
                          <option value="Policy Servicing / Customer Service">
                            Policy Servicing / Customer Service
                          </option>
                          <option value="Compliance & Legal">
                            Compliance & Legal
                          </option>
                          <option value="Risk Management">
                            Risk Management
                          </option>
                          <option value="Regulatory compliance">
                            Regulatory compliance
                          </option>
                          <option value="Finance & Accounts">
                            Finance & Accounts
                          </option>
                          <option value="Investments / Fund Management">
                            Investments / Fund Management
                          </option>
                          <option value="Human Resources (HR)">
                            Human Resources (HR)
                          </option>
                          <option value="IT / Technology">
                            IT / Technology
                          </option>
                          <option value="Administration & Facilities">
                            Administration & Facilities
                          </option>
                          <option value="Marketing & Brand Management">
                            Marketing & Brand Management
                          </option>
                          <option value="Analytics & Business Intelligence">
                            Analytics & Business Intelligence
                          </option>
                          <option value="Partnership & Alliances Acquisition">
                            Partnership & Alliances Acquisition
                          </option>
                          <option value="Corportate Sales">
                            Corportate Sales
                          </option>
                          <option value="OEM">OEM</option>
                          <option value="Group Insurance">
                            Group Insurance
                          </option>
                          <option value="Other">Other</option>
                        </select>
                        {watchDepartment === "Other" && (
                          <Controller
                            name="customDepartment"
                            control={control}
                            render={({ field: customField }) => (
                              <input
                                {...customField}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CTC (in Lakhs)
                  </label>
                  <Controller
                    name="ctcInLakhs"
                    control={control}
                    render={({ field }) => (
                      <input
                        value={ctcDisplay}
                        onChange={(e) => setCtcDisplay(e.target.value)}
                        onBlur={() => {
                          let value = ctcDisplay.replace(/[^0-9.]/g, "");
                          const parts = value.split(".");
                          if (parts.length > 2)
                            value = parts[0] + "." + parts.slice(1).join("");
                          parts[0] = parts[0].substring(0, 3); // Limit to 3 digits before decimal
                          if (parts[1]) parts[1] = parts[1].substring(0, 2); // Limit to 2 digits after decimal
                          value = parts[0] + (parts[1] ? "." + parts[1] : "");
                          // Pad with zeros to make 000.00 format
                          while (parts[0].length < 3) parts[0] = "0" + parts[0];
                          value =
                            parts[0] + (parts[1] ? "." + parts[1] : ".00");
                          field.onChange(value);
                        }}
                        type="text"
                        placeholder="000.00"
                        className={inputClass}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Total Experience (Years)
                  </label>

                  <Controller
                    name="totalExperience"
                    control={control}
                    render={({ field }) => (
                      <select
                        value={field.value || ""}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="border rounded px-2 py-1 w-32"
                      >
                        <option value="">Select</option>
                        {Array.from({ length: 31 }, (_, i) => i + 5).map(
                          (num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          )
                        )}
                      </select>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white shadow-sm border border-gray-200">
            <div className="px-6 py-2" style={{ backgroundColor: "#B99D54" }}>
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                Comments
              </h2>
            </div>
            <div className="p-8 space-y-2">
              {comments.map((comment, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    value={comment}
                    onChange={(e) => updateComment(index, e.target.value)}
                    type="text"
                    placeholder={`Enter comment ${
                      index + 1
                    } (max 500 characters)`}
                    className={inputClass}
                    maxLength="500"
                  />
                  {comments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeComment(index)}
                      className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addComment}
                className="cursor-pointer inline-flex items-center px-4 py-2 text-xs text-white font-medium rounded-md transition-all duration-200 bg-[#1B2951]"
              >
                Add Comment
              </button>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="bg-white shadow-sm border border-gray-200">
            <div className="px-6 py-2" style={{ backgroundColor: "#B99D54" }}>
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
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
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 text-xs text-white font-medium rounded-md transition-all duration-200"
                  style={{ backgroundColor: "#1B2951" }}
                >
                  Choose File
                </label>
                {documentFile && (
                  <p className="mt-2 text-xs text-gray-600">
                    Selected: {documentFile.name}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  PDF or DOCX only, max 10MB
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 pb-8">
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
              className={`px-8 py-3 font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2 text-white ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "shadow-lg hover:shadow-xl"
              }`}
              style={!isSubmitting ? { backgroundColor: "#1B2951" } : {}}
            >
              {isSubmitting && (
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
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
