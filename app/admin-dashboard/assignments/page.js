"use client";
import React, { useState, useEffect } from "react";
import {ArrowLeft,FileText,User,Calendar,DollarSign,BookOpen,MapPin,Clock,CheckCircle,X,Users,Loader2,Search,Filter,Eye,Edit,Trash2,AlertCircle,CheckCircle2,} from "lucide-react";
import Link from "next/link";
import {
  getStoredToken,
  isAuthenticated,
  redirectToLogin,
} from "../../../lib/auth";
import styles from "./Assignments.module.css";

const AdminAssignmentsPage = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [adminFilter, setAdminFilter] = useState("all");
  const [alphaFilter, setAlphaFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: "",
    tentativeDeliveryDate: "",
    adminNotes: "",
    buyerPrice: "",
    alphaPrice: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(new Date());
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssignAdminModalOpen, setIsAssignAdminModalOpen] = useState(false);
  const [alphas, setAlphas] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [selectedAlpha, setSelectedAlpha] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [paymentRequestsCount, setPaymentRequestsCount] = useState(0);

  const statusOptions = [
    { value: "all", label: "All Statuses", color: "text-gray-600" },
    { value: "pending", label: "Pending", color: "text-yellow-600" },
    { value: "confirmed", label: "Confirmed", color: "text-blue-600" },
    { value: "in_progress", label: "In Progress", color: "text-purple-600" },
    { value: "completed", label: "Completed", color: "text-green-600" },
    { value: "cancelled", label: "Cancelled", color: "text-red-600" },
  ];

  const adminFilterOptions = [
    { value: "all", label: "All Admins" },
    ...admins.map(admin => ({ value: admin._id, label: admin.name }))
  ];

  const alphaFilterOptions = [
    { value: "all", label: "All Alphas" },
    ...alphas.map(alpha => ({ value: alpha._id, label: alpha.name }))
  ];

  // ALL useEffect hooks must be at the top level, before any conditional logic
  useEffect(() => {
    checkAuthAndFetchProfile();
    fetchAlphas();
    fetchAdmins();
    fetchPaymentRequestsCount();
  }, []);

  useEffect(() => {
    if (assignments.length > 0) {
      filterAssignments();
    }
  }, [assignments, searchTerm, statusFilter, adminFilter, alphaFilter]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecentUpdates();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [lastFetchTime]);

  // Helper functions
  const fetchAlphas = async () => {
    try {
      const token = getStoredToken("admin");
      if (!token) return;
      const response = await fetch("/api/alpha/list", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAlphas(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching alphas:", error);
      setError("Failed to fetch alphas");
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = getStoredToken("admin");
      if (!token) return;
      const response = await fetch("/api/admin/admins", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.data?.admins || []);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
      setError("Failed to fetch admins");
    }
  };

  const fetchRecentUpdates = async () => {
    try {
      const token = getStoredToken("admin");
      if (!token) return;

      const response = await fetch(
        `/api/admin/recent-updates?since=${lastFetchTime.toISOString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.updates && data.updates.length > 0) {
          setRecentUpdates((prev) => [...data.updates, ...prev].slice(0, 10));
          setShowNotifications(true);
          fetchAssignments();
          fetchPaymentRequestsCount();
        }
        setLastFetchTime(new Date());
      }
    } catch (error) {
      console.error("Error fetching recent updates:", error);
    }
  };

  const fetchPaymentRequestsCount = async () => {
    try {
      const token = getStoredToken("admin");
      if (!token) return;
      const res = await fetch(`/api/admin/alpha-payments?status=all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const items = data?.data || [];
      const count = items.filter((p) => p.status === "pending" || p.status === "requested").length;
      setPaymentRequestsCount(count);
    } catch (e) {
      // Non-fatal
    }
  };

  const handleCompleteDelivery = async (assignmentId) => {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      const token = getStoredToken("admin");
      const response = await fetch("/api/admin/assignments", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignmentId, status: "completed" }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to complete delivery");
      }
      setSuccess("Delivery marked as completed. Payment request created.");
      setAssignments((prev) => prev.map((a) => (a._id === assignmentId ? { ...a, ...data.data } : a)));
      fetchPaymentRequestsCount();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAssignModal = (assignment) => {
    setSelectedAssignment(assignment);
    setSelectedAlpha(assignment.assignedToAlpha?._id || "");
    setIsAssignModalOpen(true);
  };

  const handleOpenAssignAdminModal = (assignment) => {
    setSelectedAssignment(assignment);
    setSelectedAdmin(assignment.assignedToAdmin?._id || "");
    setIsAssignAdminModalOpen(true);
  };

  const handleAssignAlpha = async (e) => {
    e.preventDefault();
    if (!selectedAlpha) {
      setError("Please select an Alpha");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      const token = getStoredToken("admin");
      const response = await fetch("/api/alpha/assign-alpha", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId: selectedAssignment._id,
          alphaId: selectedAlpha,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to assign Alpha");
      }
      const data = await response.json();
      setSuccess("Alpha assigned successfully!");
      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment._id === selectedAssignment._id
            ? { ...assignment, ...data.data }
            : assignment
        )
      );
      setIsAssignModalOpen(false);
      setSelectedAssignment(null);
      setSelectedAlpha("");
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignAdmin = async (e) => {
    e.preventDefault();
    if (!selectedAdmin) {
      setError("Please select an Admin");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      const token = getStoredToken("admin");
      const response = await fetch("/api/admin/assign-admin", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId: selectedAssignment._id,
          adminId: selectedAdmin,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to assign Admin");
      }
      const data = await response.json();
      setSuccess("Admin assigned successfully!");
      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment._id === selectedAssignment._id
            ? { ...assignment, ...data.data }
            : assignment
        )
      );
      setIsAssignAdminModalOpen(false);
      setSelectedAssignment(null);
      setSelectedAdmin("");
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const checkAuthAndFetchProfile = async () => {
    try {
      if (!isAuthenticated("admin")) {
        redirectToLogin("admin");
        return;
      }

      const token = getStoredToken("admin");
      if (!token) {
        redirectToLogin("admin");
        return;
      }

      const response = await fetch("/api/admin/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          redirectToLogin("admin");
          return;
        }
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setAdmin(data.data);
      fetchAssignments();
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const token = getStoredToken("admin");
      if (!token) return;

      const response = await fetch(
        `/api/admin/assignments?page=${currentPage}&limit=20`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setError("Failed to fetch assignments");
    }
  };

  const filterAssignments = () => {
    let filtered = assignments;

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (assignment) => assignment.status === statusFilter
      );
    }

    if (adminFilter !== "all") {
      filtered = filtered.filter((assignment) => {
        return assignment.assignedToAdmin?._id === adminFilter;
      });
    }

    if (alphaFilter !== "all") {
      filtered = filtered.filter((assignment) => {
        return assignment.assignedToAlpha?._id === alphaFilter;
      });
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (assignment) =>
          assignment.title.toLowerCase().includes(lowerSearch) ||
          assignment.subject.toLowerCase().includes(lowerSearch) ||
          assignment.buyer?.name?.toLowerCase().includes(lowerSearch) ||
          assignment.buyer?.email?.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredAssignments(filtered);
  };

  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setEditFormData({
      status: assignment.status,
      tentativeDeliveryDate: assignment.tentativeDeliveryDate
        ? new Date(assignment.tentativeDeliveryDate).toISOString().split("T")[0]
        : "",
      adminNotes: assignment.adminNotes || "",
      buyerPrice: assignment.buyerPrice || assignment.budget || "",
      alphaPrice: assignment.alphaPrice || assignment.budget || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();

    if (!editFormData.status) {
      setError("Status is required");
      return;
    }

    if (!editFormData.buyerPrice || editFormData.buyerPrice <= 0) {
      setError("Valid buyer price is required");
      return;
    }

    if (!editFormData.alphaPrice || editFormData.alphaPrice <= 0) {
      setError("Valid alpha price is required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const token = getStoredToken("admin");
      const response = await fetch("/api/admin/assignments", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId: selectedAssignment._id,
          ...editFormData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update assignment");
      }

      const data = await response.json();
      setSuccess("Assignment updated successfully!");

      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment._id === selectedAssignment._id
            ? { ...assignment, ...data.data }
            : assignment
        )
      );

      setIsEditModalOpen(false);
      setSelectedAssignment(null);
      setEditFormData({
        status: "",
        tentativeDeliveryDate: "",
        adminNotes: "",
        buyerPrice: "",
        alphaPrice: "",
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (
      !confirm(
        "Are you sure you want to delete this assignment? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = getStoredToken("admin");
      const response = await fetch(
        `/api/admin/assignments?id=${assignmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setSuccess("Assignment deleted successfully!");
        setAssignments((prev) =>
          prev.filter((assignment) => assignment._id !== assignmentId)
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete assignment");
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "confirmed":
        return "text-blue-600 bg-blue-100";
      case "in_progress":
        return "text-purple-600 bg-purple-100";
      case "completed":
        return "text-green-600 bg-green-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock size={16} />;
      case "confirmed":
        return <CheckCircle size={16} />;
      case "in_progress":
        return <Loader2 size={16} />;
      case "completed":
        return <CheckCircle2 size={16} />;
      case "cancelled":
        return <X size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  // Early return for loading state - AFTER all hooks
  if (loading) {
    return (
      <div className={styles["admin-assignments-page"]}>
        <div className={styles["loading-container"]}>
          <Loader2 size={48} className={styles.spinner} />
          <p>Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["admin-assignments-page"]}>
      {/* Header */}
      <div className={styles["assignments-header"]}>
        <div className={styles["header-content"]}>
          <Link href="/admin-dashboard" className={styles["back-button"]}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
          <h1>Assignment Management</h1>
        </div>
      </div>

      {/* Notifications Section */}
      {showNotifications && recentUpdates.length > 0 && (
        <div className={styles["notifications-section"]}>
          <div className={styles["notification-header"]}>
            <h3>Recent Updates</h3>
            <button
              className={styles["close-notifications"]}
              onClick={() => setShowNotifications(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div className={styles["notifications-list"]}>
            {recentUpdates.slice(0, 5).map((update, index) => (
              <div key={index} className={styles["notification-item"]}>
                <div className={styles["notification-icon"]}>
                  {update.type === "completed" && (
                    <CheckCircle2 size={16} className="text-green-600" />
                  )}
                  {update.type === "status_change" && (
                    <Clock size={16} className="text-blue-600" />
                  )}
                </div>
                <div className={styles["notification-content"]}>
                  <p className={styles["notification-message"]}>
                    {update.message}
                  </p>
                  <span className={styles["notification-time"]}>
                    {new Date(update.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className={styles["error-message"]}>
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}
      {success && (
        <div className={styles["success-message"]}>
          <CheckCircle size={16} />
          {success}
          <button onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      {/* Stats Section */}
      <div className={styles["stats-section"]}>
        <div className={styles["stat-card"]}>
          <div className={styles["stat-icon"]}>
            <FileText size={24} />
          </div>
          <div className={styles["stat-content"]}>
            <h3>{assignments.length}</h3>
            <p>Total Assignments</p>
          </div>
        </div>
        <div className={styles["stat-card"]}>
          <div className={styles["stat-icon"]}>
            <Clock size={24} />
          </div>
          <div className={styles["stat-content"]}>
            <h3>{assignments.filter((a) => a.status === "pending").length}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className={styles["stat-card"]}>
          <div className={styles["stat-icon"]}>
            <CheckCircle size={24} />
          </div>
          <div className={styles["stat-content"]}>
            <h3>
              {assignments.filter((a) => a.status === "confirmed").length}
            </h3>
            <p>Confirmed</p>
          </div>
        </div>
        <div className={styles["stat-card"]}>
          <div className={styles["stat-icon"]}>
            <CheckCircle2 size={24} />
          </div>
          <div className={styles["stat-content"]}>
            <h3>
              {assignments.filter((a) => a.status === "completed").length}
            </h3>
            <p>Completed</p>
          </div>
        </div>
        <div className={styles["stat-card"]}>
          <div className={styles["stat-icon"]}>
            <DollarSign size={24} />
          </div>
          <div className={styles["stat-content"]}>
            <h3>{paymentRequestsCount}</h3>
            <p>Payment Requests</p>
          </div>
        </div>
      </div>

       {/* Filters and Search */}
       <div className={styles["filters-section"]}>
         <div className={styles["search-box"]}>
           <Search size={20} />
           <input
             type="text"
             placeholder="Search assignments, subjects, or buyers..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
         </div>
         <div className={styles["filter-controls"]}>
           <select
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className={styles["status-filter"]}
           >
             {statusOptions.map((option) => (
               <option key={option.value} value={option.value}>
                 {option.label}
               </option>
             ))}
           </select>
           <select
             value={adminFilter}
             onChange={(e) => setAdminFilter(e.target.value)}
             className={styles["admin-filter"]}
           >
             {adminFilterOptions.map((option) => (
               <option key={option.value} value={option.value}>
                 {option.label}
               </option>
             ))}
           </select>
           <select
             value={alphaFilter}
             onChange={(e) => setAlphaFilter(e.target.value)}
             className={styles["alpha-filter"]}
           >
             {alphaFilterOptions.map((option) => (
               <option key={option.value} value={option.value}>
                 {option.label}
               </option>
             ))}
           </select>
         </div>
       </div>

      {/* Assignments List */}
      <div className={styles["assignments-content"]}>
        {filteredAssignments.length === 0 ? (
          <div className={styles["empty-state"]}>
            <FileText size={64} />
            <h3>No assignments found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className={styles["assignments-list"]}>
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment._id}
                className={`${styles["assignment-card"]} ${
                  assignment.status === "completed" ? styles.completed : ""
                }`}
              >
                <div className={styles["assignment-header"]}>
                  <div className={styles["assignment-type"]}>
                    <FileText size={20} />
                    <span className={styles["type-label"]}>Assignment</span>
                  </div>
                  <div
                    className={`${styles["status-badge"]} ${getStatusColor(
                      assignment.status
                    )}`}
                  >
                    {getStatusIcon(assignment.status)}
                    <span>
                      {assignment.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className={styles["assignment-content"]}>
                  <h3 className={styles["assignment-title"]}>
                    {assignment.title}
                  </h3>
                  <p className={styles["assignment-description"]}>
                    {assignment.description}
                  </p>

                  <div className={styles["assignment-details"]}>
                    <div className={styles["detail-item"]}>
                      <BookOpen size={16} />
                      <span>{assignment.subject}</span>
                    </div>
                    {assignment.deadline && (
                      <div className={styles["detail-item"]}>
                        <Calendar size={16} />
                        <span>
                          Due:{" "}
                          {new Date(assignment.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className={styles["detail-item"]}>
                      <DollarSign size={16} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span>Original Budget: ₹{assignment.budget}</span>
                        {assignment.buyerPrice && (
                          <span style={{ color: '#007bff', fontWeight: '600' }}>
                            Buyer Price: ₹{assignment.buyerPrice}
                          </span>
                        )}
                        {assignment.alphaPrice && (
                          <span style={{ color: '#059669', fontWeight: '600' }}>
                            Alpha Price: ₹{assignment.alphaPrice}
                          </span>
                        )}
                        {(!assignment.buyerPrice || !assignment.alphaPrice) && (
                          <span style={{ color: '#dc3545', fontSize: '0.8rem' }}>
                            Prices not set
                          </span>
                        )}
                      </div>
                    </div>
                    {assignment.location && (
                      <div className={styles["detail-item"]}>
                        <MapPin size={16} />
                        <span>{assignment.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Completion Indicator */}
                  {assignment.status === "completed" &&
                    assignment.completedAt && (
                      <div className={styles["completion-indicator"]}>
                        <CheckCircle2 size={16} />
                        <span>
                          Completed on{" "}
                          {new Date(
                            assignment.completedAt
                          ).toLocaleDateString()}
                          {assignment.completedByAlpha && " by Alpha"}
                        </span>
                      </div>
                    )}

                  {/* Buyer Information */}
                  <div className={styles["buyer-info"]}>
                    <h4>Buyer Details:</h4>
                    <div className={styles["buyer-details"]}>
                      <div className={styles["buyer-item"]}>
                        <User size={16} />
                        <span>
                          <strong>Name:</strong>{" "}
                          {assignment.buyer?.name || "N/A"}
                        </span>
                      </div>
                      <div className={styles["buyer-item"]}>
                        <span>
                          <strong>Email:</strong>{" "}
                          {assignment.buyer?.email || "N/A"}
                        </span>
                      </div>
                      <div className={styles["buyer-item"]}>
                        <span>
                          <strong>College:</strong>{" "}
                          {assignment.buyer?.university ||
                            assignment.buyer?.college ||
                            "N/A"}
                        </span>
                      </div>
                      {assignment.buyer?.phone && (
                        <div className={styles["buyer-item"]}>
                          <span>
                            <strong>Phone:</strong> {assignment.buyer.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                   {/* Assignment Team Information */}
                   {(assignment.assignedToAlpha || assignment.assignedToAdmin) && (
                     <div className={styles["buyer-info"]}>
                       <h4>Assignment Team:</h4>
                       <div className={styles["buyer-details"]}>
                         {/* Assigned Alpha Information */}
                         {assignment.assignedToAlpha && (
                           <div className={styles["team-member"]}>
                             <div className={styles["team-member-header"]}>
                               <Users size={16} />
                               <strong>Alpha (Worker):</strong>
                             </div>
                             <div className={styles["team-member-details"]}>
                               <div className={styles["buyer-item"]}>
                                 <span>
                                   <strong>Name:</strong>{" "}
                                   {assignment.assignedToAlpha.name || "N/A"}
                                 </span>
                               </div>
                               <div className={styles["buyer-item"]}>
                                 <span>
                                   <strong>Email:</strong>{" "}
                                   {assignment.assignedToAlpha.email || "N/A"}
                                 </span>
                               </div>
                               <div className={styles["buyer-item"]}>
                                 <span>
                                   <strong>Phone:</strong>{" "}
                                   {assignment.assignedToAlpha.phone || "N/A"}
                                 </span>
                               </div>
                             </div>
                           </div>
                         )}

                         {/* Assigned Admin Information */}
                         {assignment.assignedToAdmin && (
                           <div className={styles["team-member"]}>
                             <div className={styles["team-member-header"]}>
                               <User size={16} />
                               <strong>Admin (Supervisor):</strong>
                             </div>
                             <div className={styles["team-member-details"]}>
                               <div className={styles["buyer-item"]}>
                                 <span>
                                   <strong>Name:</strong>{" "}
                                   {assignment.assignedToAdmin.name || "N/A"}
                                 </span>
                               </div>
                               <div className={styles["buyer-item"]}>
                                 <span>
                                   <strong>Email:</strong>{" "}
                                   {assignment.assignedToAdmin.email || "N/A"}
                                 </span>
                               </div>
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                   )}

                  {assignment.additionalRequirements && (
                    <div className={styles["additional-requirements"]}>
                      <h4>Additional Requirements:</h4>
                      <p>{assignment.additionalRequirements}</p>
                    </div>
                  )}

                  {assignment.pdfUrl && (
                    <div className={styles["pdf-attachment"]}>
                      <h4>Attached PDF:</h4>
                      <a
                        href={assignment.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles["pdf-link"]}
                      >
                        <FileText size={16} />
                        <span>View Assignment PDF</span>
                      </a>
                    </div>
                  )}

                  {assignment.tentativeDeliveryDate && (
                    <div className={styles["delivery-info"]}>
                      <h4>Delivery Information:</h4>
                      <div className={styles["delivery-details"]}>
                        <div className={styles["delivery-item"]}>
                          <Calendar size={16} />
                          <span>
                            <strong>Tentative Delivery:</strong>{" "}
                            {new Date(
                              assignment.tentativeDeliveryDate
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        {assignment.adminNotes && (
                          <div className={styles["admin-notes"]}>
                            <span>
                              <strong>Admin Notes:</strong>{" "}
                              {assignment.adminNotes}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles["assignment-footer"]}>
                  <div className={styles["assignment-meta"]}>
                    <span>
                      Posted:{" "}
                      {new Date(assignment.createdAt).toLocaleDateString()}
                    </span>
                    {assignment.confirmedAt && (
                      <span className={styles["confirmed-date"]}>
                        Confirmed:{" "}
                        {new Date(assignment.confirmedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className={styles["assignment-actions"]}>
                    <button
                      className={`${styles["action-button"]} ${styles.view}`}
                      onClick={() => handleEditAssignment(assignment)}
                    >
                      <Edit size={16} />
                      Manage
                    </button>
                    <button
                      className={`${styles["action-button"]} ${styles["assign-alpha"]}`}
                      onClick={() => handleOpenAssignModal(assignment)}
                    >
                      <Users size={16} />
                      {assignment.assignedToAlpha 
                        ? `Alpha: ${assignment.assignedToAlpha.name}` 
                        : "Assign Alpha"
                      }
                    </button>
                    <button
                      className={`${styles["action-button"]} ${styles["assign-admin"]}`}
                      onClick={() => handleOpenAssignAdminModal(assignment)}
                    >
                      <User size={16} />
                      {assignment.assignedToAdmin 
                        ? `Admin: ${assignment.assignedToAdmin.name}` 
                        : "Assign Admin"
                      }
                    </button>
                    {assignment.status === "alpha_completed" && (
                      <button
                        className={`${styles["action-button"]}`}
                        onClick={() => handleCompleteDelivery(assignment._id)}
                        disabled={submitting}
                      >
                        <CheckCircle2 size={16} />
                        Complete Delivery
                      </button>
                    )}
                    {assignment.status === "completed" && (
                      <button className={`${styles["action-button"]}`} disabled>
                        <CheckCircle2 size={16} />
                        Delivery Completed
                      </button>
                    )}
                    <button
                      className={`${styles["action-button"]} ${styles.delete}`}
                      onClick={() => handleDeleteAssignment(assignment._id)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={styles["pagination-button"]}
          >
            Previous
          </button>
          <span className={styles["page-info"]}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className={styles["pagination-button"]}
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {isEditModalOpen && selectedAssignment && (
        <div
          className={styles["modal-overlay"]}
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className={styles["edit-modal"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["modal-header"]}>
              <h2>Manage Assignment</h2>
              <button
                className={styles["close-button"]}
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={handleUpdateAssignment}
              className={styles["edit-form"]}
            >
              <div className={styles["form-group"]}>
                <label>Assignment Title</label>
                <input
                  type="text"
                  value={selectedAssignment.title}
                  disabled
                  className={styles["disabled-input"]}
                />
              </div>

              <div className={styles["form-group"]}>
                <label>Status *</label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className={styles["form-group"]}>
                <label>Tentative Delivery Date</label>
                <input
                  type="date"
                  value={editFormData.tentativeDeliveryDate}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      tentativeDeliveryDate: e.target.value,
                    }))
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className={styles["form-row"]}>
                <div className={styles["form-group"]}>
                  <label>Buyer Price (₹) *</label>
                  <input
                    type="number"
                    value={editFormData.buyerPrice}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        buyerPrice: e.target.value,
                      }))
                    }
                    placeholder="Enter buyer price"
                    min="0"
                    step="0.01"
                    required
                  />
                  <small style={{ color: '#666', fontSize: '0.8rem' }}>
                    What buyer will pay (visible to buyer)
                  </small>
                </div>
                <div className={styles["form-group"]}>
                  <label>Alpha Price (₹) *</label>
                  <input
                    type="number"
                    value={editFormData.alphaPrice}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        alphaPrice: e.target.value,
                      }))
                    }
                    placeholder="Enter alpha price"
                    min="0"
                    step="0.01"
                    required
                  />
                  <small style={{ color: '#666', fontSize: '0.8rem' }}>
                    What alpha will receive (visible to alpha)
                  </small>
                </div>
              </div>
              
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '10px', 
                borderRadius: '6px', 
                marginBottom: '20px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '5px' }}>
                  <strong>Original Budget:</strong> ₹{selectedAssignment.budget}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  <strong>Profit Margin:</strong> ₹{(parseFloat(editFormData.buyerPrice || 0) - parseFloat(editFormData.alphaPrice || 0)).toFixed(2)}
                </div>
              </div>

              <div className={styles["form-group"]}>
                <label>Admin Notes</label>
                <textarea
                  value={editFormData.adminNotes}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      adminNotes: e.target.value,
                    }))
                  }
                  placeholder="Add any notes or instructions..."
                  rows={4}
                />
              </div>

              <div className={styles["form-actions"]}>
                <button
                  type="button"
                  className={styles["cancel-button"]}
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles["submit-button"]}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Update Assignment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Alpha Modal */}
      {isAssignModalOpen && selectedAssignment && (
        <div
          className={styles["modal-overlay"]}
          onClick={() => setIsAssignModalOpen(false)}
        >
          <div
            className={styles["edit-modal"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["modal-header"]}>
              <h2>Assign Alpha for {selectedAssignment.title}</h2>
              <button
                className={styles["close-button"]}
                onClick={() => setIsAssignModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAssignAlpha} className={styles["edit-form"]}>
              {error && (
                <div className={styles["error-message"]}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              {success && (
                <div className={styles["success-message"]}>
                  <CheckCircle size={16} />
                  {success}
                </div>
              )}
              <div className={styles["form-group"]}>
                <label>Select Alpha *</label>
                <select
                  value={selectedAlpha}
                  onChange={(e) => setSelectedAlpha(e.target.value)}
                  required
                >
                  <option value="">-- Select an Alpha --</option>
                  {alphas.map((alpha) => (
                    <option key={alpha._id} value={alpha._id}>
                      {alpha.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles["form-actions"]}>
                <button
                  type="button"
                  className={styles["cancel-button"]}
                  onClick={() => setIsAssignModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles["submit-button"]}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Confirm Assignment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Admin Modal */}
      {isAssignAdminModalOpen && selectedAssignment && (
        <div
          className={styles["modal-overlay"]}
          onClick={() => setIsAssignAdminModalOpen(false)}
        >
          <div
            className={styles["edit-modal"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["modal-header"]}>
              <h2>Assign Admin for {selectedAssignment.title}</h2>
              <button
                className={styles["close-button"]}
                onClick={() => setIsAssignAdminModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAssignAdmin} className={styles["edit-form"]}>
              {error && (
                <div className={styles["error-message"]}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              {success && (
                <div className={styles["success-message"]}>
                  <CheckCircle size={16} />
                  {success}
                </div>
              )}
              <div className={styles["form-group"]}>
                <label>Select Admin *</label>
                <select
                  value={selectedAdmin}
                  onChange={(e) => setSelectedAdmin(e.target.value)}
                  required
                >
                  <option value="">-- Select an Admin --</option>
                  {admins.map((admin) => (
                    <option key={admin._id} value={admin._id}>
                      {admin.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles["form-actions"]}>
                <button
                  type="button"
                  className={styles["cancel-button"]}
                  onClick={() => setIsAssignAdminModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles["submit-button"]}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Assign Admin
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssignmentsPage;
