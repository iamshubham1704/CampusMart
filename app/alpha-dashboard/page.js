"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AlphaDashboard() {
  const [alphaData, setAlphaData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentStats, setPaymentStats] = useState({
    thisMonth: 0,
    readyToRequest: 0,
  });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [statusFilter, setStatusFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("alphaToken");
      const alphaInfo = localStorage.getItem("alphaData");

      if (!token || !alphaInfo) {
        router.push("/alpha-login");
        return;
      }

      try {
        const parsedAlphaInfo = JSON.parse(alphaInfo);
        setAlphaData(parsedAlphaInfo);

        // Fetch assignments
        const res = await fetch("/api/alpha/assignments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ alphaName: parsedAlphaInfo.name }),
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || "Failed to fetch assignments");
        }
        setAssignments(result.assignments);

        // Fetch payment stats
        const paymentRes = await fetch("/api/alpha/payments/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (paymentRes.ok) {
          const paymentData = await paymentRes.json();
          setPaymentStats({
            thisMonth: paymentData.thisMonth || 0,
            readyToRequest: paymentData.readyToRequest || 0,
          });
        }
      } catch (err) {
        console.error("Error fetching assignments or payments:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // Filter assignments based on status
  const filteredAssignments = assignments.filter((assignment) => {
    if (statusFilter === "all") return true;
    return assignment.status === statusFilter;
  });

  // Calculate statistics
  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === "pending").length,
    inProgress: assignments.filter((a) => a.status === "in-progress").length,
    completed: assignments.filter((a) => a.status === "completed").length,
    overdue: assignments.filter(
      (a) => new Date(a.deadline) < new Date() && a.status !== "completed"
    ).length,
  };

  // Get status badge style
  const getStatusBadgeStyle = (status) => {
    let backgroundColor = "#f1f5f9";
    let color = "#64748b";

    switch (status) {
      case "pending":
        backgroundColor = "#fef3c7";
        color = "#92400e";
        break;
      case "in-progress":
        backgroundColor = "#ddd6fe";
        color = "#6b21a8";
        break;
      case "completed":
        backgroundColor = "#d1fae5";
        color = "#065f46";
        break;
      case "overdue":
        backgroundColor = "#fee2e2";
        color = "#991b1b";
        break;
      default:
        break;
    }

    return {
      display: "inline-block",
      padding: "0.25rem 0.75rem",
      fontSize: "0.75rem",
      fontWeight: "600",
      borderRadius: "9999px",
      backgroundColor,
      color,
    };
  };

  // Get priority badge style
  const getPriorityBadgeStyle = (priority) => {
    let backgroundColor = "#f1f5f9";
    let color = "#64748b";

    switch (priority) {
      case "high":
        backgroundColor = "#fee2e2";
        color = "#991b1b";
        break;
      case "medium":
        backgroundColor = "#fef3c7";
        color = "#92400e";
        break;
      case "low":
        backgroundColor = "#ecfdf5";
        color = "#065f46";
        break;
      default:
        break;
    }

    return {
      display: "inline-block",
      padding: "0.25rem 0.5rem",
      fontSize: "0.7rem",
      fontWeight: "500",
      borderRadius: "4px",
      backgroundColor,
      color,
    };
  };

  // Update assignment status
// Updated updateAssignmentStatus function in your frontend
const updateAssignmentStatus = async (assignmentId, newStatus) => {
  try {
    const token = localStorage.getItem("alphaToken");
    const alphaData = JSON.parse(localStorage.getItem("alphaData") || "{}");

    if (!token || !alphaData.name) {
      alert("Authentication error. Please login again.");
      router.push("/alpha-login");
      return;
    }

    const res = await fetch("/api/alpha/assignments/update-status", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        assignmentId: String(assignmentId),
        status: newStatus,
        completedAt: newStatus === "completed" ? new Date().toISOString() : null,
        alphaName: alphaData.name, // ✅ Pass alphaName to match fetch logic
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      // More detailed error handling
      console.error("Update failed:", {
        status: res.status,
        error: result.error,
        debug: result.debug
      });
      throw new Error(result.error || `HTTP ${res.status}: Failed to update status`);
    }

    const updatedAssignment = result.data;
    if (!updatedAssignment || !updatedAssignment._id) {
      console.warn("Warning: Backend returned no updated assignment. Skipping state update.");
      alert("Task updated successfully!");
      return;
    }

    // Update state
    setAssignments((prev) =>
      prev.map((a) =>
        a && a._id && String(a._id) === String(updatedAssignment._id)
          ? updatedAssignment
          : a
      )
    );

    alert(`Task ${newStatus === "completed" ? "completed" : "updated"} successfully!`);
  } catch (err) {
    console.error("Error updating status:", err);
    alert(`Error: ${err.message}`);
  }
};

  // Accept assignment -> move to in-progress
  const acceptAssignment = async (assignmentId) => {
    await updateAssignmentStatus(assignmentId, "in-progress");
  };

  // Reject assignment -> backend will unassign and set pending
  const rejectAssignment = async (assignmentId) => {
    const confirmReject = confirm("Are you sure you want to reject this task?");
    if (!confirmReject) return;
    await updateAssignmentStatus(assignmentId, "rejected");
    // Optimistically remove from list (it won't belong to this alpha anymore)
    setAssignments((prev) => prev.filter((a) => String(a._id) !== String(assignmentId)));
  };



  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `@keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }`;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Loading State
  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={loadingContentStyle}>
          <div style={spinnerStyle}></div>
          <p style={loadingTextStyle}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div style={errorContainerStyle}>
        <div style={errorContentStyle}>
          <h1 style={errorHeadingStyle}>Error</h1>
          <p style={errorTextStyle}>{error}</p>
          <button
            onClick={() => router.push("/alpha-login")}
            style={loginButtonStyle}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={dashboardContainerStyle}>
      <div style={dashboardInnerContainerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h1 style={headingStyle}>{alphaData?.name}'s Dashboard</h1>
          <div style={userInfoStyle}>
            <span style={welcomeTextStyle}>Welcome back!</span>
            <div style={profileBadgeStyle}>Alpha Expert</div>
          </div>
        </div>



        {/* Navigation Tabs */}
        <div style={tabNavigationStyle}>
          <button
            style={activeTab === "overview" ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            style={activeTab === "tasks" ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab("tasks")}
          >
            Assigned Tasks ({assignments.length})
          </button>
          <button
            style={activeTab === "analytics" ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div style={tabContentStyle}>
            {/* Statistics Cards */}
            <div style={statsContainerStyle}>
              <div style={statCardStyle}>
                <div style={statIconStyle}>📋</div>
                <div style={statContentStyle}>
                  <h3 style={statNumberStyle}>{stats.total}</h3>
                  <p style={statLabelStyle}>Total Tasks</p>
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={statIconStyle}>⏳</div>
                <div style={statContentStyle}>
                  <h3 style={statNumberStyle}>{stats.pending}</h3>
                  <p style={statLabelStyle}>Pending</p>
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={statIconStyle}>🔄</div>
                <div style={statContentStyle}>
                  <h3 style={statNumberStyle}>{stats.inProgress}</h3>
                  <p style={statLabelStyle}>In Progress</p>
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={statIconStyle}>✅</div>
                <div style={statContentStyle}>
                  <h3 style={statNumberStyle}>{stats.completed}</h3>
                  <p style={statLabelStyle}>Completed</p>
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={statIconStyle}>⚠️</div>
                <div style={statContentStyle}>
                  <h3 style={statNumberStyle}>{stats.overdue}</h3>
                  <p style={statLabelStyle}>Overdue</p>
                </div>
              </div>
            </div>

            {/* Recent Tasks & Payment Overview Side by Side */}
            <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Recent Tasks */}
              <div style={{ flex: 2, minWidth: 0 }}>
                <h2 style={sectionHeadingStyle}>Recent Tasks</h2>
                <div style={taskPreviewContainerStyle}>
                  {assignments.slice(0, 3).map((assignment) => (
                    <div key={assignment._id} style={taskPreviewCardStyle}>
                      <div style={taskPreviewHeaderStyle}>
                        <h4 style={taskPreviewTitleStyle}>{assignment.title}</h4>
                        <span style={getStatusBadgeStyle(assignment.status)}>
                          {assignment.status}
                        </span>
                      </div>
                      <p style={taskPreviewDescStyle}>{assignment.description}</p>
                      <div style={taskPreviewMetaStyle}>
                        <span>
                          Due:{" "}
                          {new Date(assignment.deadline).toLocaleDateString()}
                        </span>
                        <span>Type: {assignment.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  style={viewAllButtonStyle}
                  onClick={() => setActiveTab("tasks")}
                >
                  View All Tasks →
                </button>
              </div>
              {/* Payment Overview Card */}
              <div style={{
                flex: 1,
                minWidth: 320,
                background: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)',
                border: '2px solid #10b981',
                borderRadius: 16,
                boxShadow: '0 4px 24px rgba(16,185,129,0.08)',
                padding: '2rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 0,
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
                <div style={{ fontWeight: 700, fontSize: 22, color: '#059669', marginBottom: 4 }}>
                  ₹{paymentStats.thisMonth.toLocaleString()}
                </div>
                <div style={{ color: '#374151', fontWeight: 500, fontSize: 16, marginBottom: 16 }}>
                  Earnings This Month
                </div>
                <div style={{ color: '#059669', fontWeight: 600, fontSize: 15, marginBottom: 16 }}>
                  Ready to Request: {paymentStats.readyToRequest}
                </div>
                <button
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 16,
                    boxShadow: '0 2px 8px rgba(16,185,129,0.10)',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => router.push('/alpha-dashboard/payments')}
                >
                  View All Payments
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <div style={tabContentStyle}>
            {/* Task Filters */}
            <div style={filterContainerStyle}>
              <h2 style={sectionHeadingStyle}>Assigned Tasks</h2>
              <div style={filterButtonsStyle}>
                <button
                  style={
                    statusFilter === "all"
                      ? activeFilterStyle
                      : filterButtonStyle
                  }
                  onClick={() => setStatusFilter("all")}
                >
                  All ({stats.total})
                </button>
                <button
                  style={
                    statusFilter === "pending"
                      ? activeFilterStyle
                      : filterButtonStyle
                  }
                  onClick={() => setStatusFilter("pending")}
                >
                  Pending ({stats.pending})
                </button>
                <button
                  style={
                    statusFilter === "in-progress"
                      ? activeFilterStyle
                      : filterButtonStyle
                  }
                  onClick={() => setStatusFilter("in-progress")}
                >
                  In Progress ({stats.inProgress})
                </button>
                <button
                  style={
                    statusFilter === "completed"
                      ? activeFilterStyle
                      : filterButtonStyle
                  }
                  onClick={() => setStatusFilter("completed")}
                >
                  Completed ({stats.completed})
                </button>
              </div>
            </div>

            {/* Tasks List */}
            <div style={tasksListContainerStyle}>
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((assignment) => (
                  <div key={assignment._id} style={taskCardStyle}>
                    {/* Task Header */}
                    <div style={taskHeaderStyle}>
                      <div style={taskTitleSectionStyle}>
                        <h3 style={taskTitleStyle}>{assignment.title}</h3>
                        <div style={taskBadgesStyle}>
                          <span style={getStatusBadgeStyle(assignment.status)}>
                            {assignment.status}
                          </span>
                          {assignment.type && (
                            <span style={getPriorityBadgeStyle("medium")}>
                              {assignment.type}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={taskActionsStyle}>
                        {assignment.status === "pending" ? (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              onClick={() => acceptAssignment(assignment._id)}
                              style={{
                                padding: "0.5rem 1rem",
                                background: "#10b981",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                              }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => rejectAssignment(assignment._id)}
                              style={{
                                padding: "0.5rem 1rem",
                                background: "#ef4444",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <select
                            value={assignment.status}
                            onChange={(e) =>
                              updateAssignmentStatus(
                                assignment._id,
                                e.target.value
                              )
                            }
                            style={statusSelectStyle}
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Task Content */}
                    <div style={taskContentStyle}>
                      <p style={taskDescriptionStyle}>
                        {assignment.description}
                      </p>

                      {/* Task Details Grid */}
                      <div style={taskDetailsGridStyle}>
                        <div style={taskDetailItemStyle}>
                          <span style={taskDetailLabelStyle}>Type:</span>
                          <span style={taskDetailValueStyle}>
                            {assignment.type}
                          </span>
                        </div>
                        <div style={taskDetailItemStyle}>
                          <span style={taskDetailLabelStyle}>Deadline:</span>
                          <span style={taskDetailValueStyle}>
                            {new Date(assignment.deadline).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={taskDetailItemStyle}>
                          <span style={taskDetailLabelStyle}>Assigned By:</span>
                          <span
                            style={taskDetailValueStyle}
                            title={assignment.assignedByEmail}
                          >
                            {assignment.assignedBy}
                          </span>
                        </div>
                        <div style={taskDetailItemStyle}>
                          <span style={taskDetailLabelStyle}>Created:</span>
                          <span style={taskDetailValueStyle}>
                            {new Date(
                              assignment.createdAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={taskDetailItemStyle}>
                          <span style={taskDetailLabelStyle}>Price:</span>
                          <span style={{ 
                            ...taskDetailValueStyle, 
                            color: '#059669', 
                            fontWeight: '600',
                            fontSize: '16px'
                          }}>
                            ₹{assignment.alphaPrice || assignment.budget || 'Not set'}
                          </span>
                        </div>
                        {assignment.subject && (
                          <div style={taskDetailItemStyle}>
                            <span style={taskDetailLabelStyle}>Subject:</span>
                            <span style={taskDetailValueStyle}>
                              {assignment.subject}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Additional Requirements Section */}
                      {assignment.additionalRequirements && (
                        <div style={additionalRequirementsStyle}>
                          <h4 style={requirementsTitleStyle}>
                            Additional Requirements:
                          </h4>
                          <p style={requirementsTextStyle}>
                            {assignment.additionalRequirements}
                          </p>
                        </div>
                      )}

                      {/* PDF Attachment */}
                      {assignment.pdfUrl && (
                        <div style={attachmentSectionStyle}>
                          <h4 style={attachmentTitleStyle}>Attachments:</h4>
                          <a
                            href={assignment.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={pdfLinkStyle}
                          >
                            📄 View Assignment PDF
                          </a>
                        </div>
                      )}

                      {/* Admin Contact (only name + phone) */}
                      {assignment.assignedBy && (
                        <div style={contactSectionStyle}>
                          <h4 style={contactTitleStyle}>Admin Contact:</h4>
                          <div style={contactDetailsStyle}>
                            <div style={contactItemStyle}>
                              <span style={contactLabelStyle}>Name:</span>
                              <span style={contactLinkStyle}>
                                {assignment.assignedBy}
                              </span>
                            </div>
                            {assignment.assignedByPhone && (
                              <div style={contactItemStyle}>
                                <span style={contactLabelStyle}>Phone:</span>
                                <a
                                  href={`tel:${assignment.assignedByPhone}`}
                                  style={contactLinkStyle}
                                >
                                  {assignment.assignedByPhone}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: "1rem" }}>
  {assignment.status === "in-progress" && (
    <button
      onClick={() => updateAssignmentStatus(assignment._id, "completed")}
      style={{
        padding: "0.75rem 1.5rem",
        background: "#10b981",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "0.9rem",
        fontWeight: "500",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.target.style.background = "#059669";
        e.target.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.target.style.background = "#10b981";
        e.target.style.transform = "translateY(0)";
      }}
    >
      ✅ Mark as Complete
    </button>
  )}
  {assignment.status === "pending" && (
    <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>
      Please accept the task to start work.
    </div>
  )}
  {assignment.status === "completed" && (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <span
        style={{
          display: "inline-block",
          padding: "0.5rem 1rem",
          background: "#d1fae5",
          color: "#065f46",
          borderRadius: "8px",
          fontWeight: "600",
        }}
      >
        ✅ Task Completed
      </span>
      {assignment.completedAt && (
        <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
          Completed on: {new Date(assignment.completedAt).toLocaleDateString()} at {new Date(assignment.completedAt).toLocaleTimeString()}
        </span>
      )}
    </div>
  )}
</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={emptyStateStyle}>
                  <div style={emptyIconStyle}>📝</div>
                  <h3 style={emptyTitleStyle}>No tasks found</h3>
                  <p style={emptyDescStyle}>
                    {statusFilter === "all"
                      ? "You haven't been assigned any tasks yet."
                      : `No tasks with status "${statusFilter}" found.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div style={tabContentStyle}>
            <h2 style={sectionHeadingStyle}>Performance Analytics</h2>
            <div style={analyticsContainerStyle}>
              <div style={analyticsCardStyle}>
                <h3>Completion Rate</h3>
                <div style={completionRateStyle}>
                  {stats.total > 0
                    ? Math.round((stats.completed / stats.total) * 100)
                    : 0}
                  %
                </div>
              </div>
              <div style={analyticsCardStyle}>
                <h3>Average Response Time</h3>
                <div style={responseTimeStyle}>2.5 hours</div>
              </div>
              <div style={analyticsCardStyle}>
                <h3>Tasks This Month</h3>
                <div style={monthlyTasksStyle}>{stats.total}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Styles with Professional Gray/Green Theme
const baseStyles = {
  fontFamily: '"Inter", "Segoe UI", sans-serif',
  background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
  minHeight: "100vh",
};

const dashboardContainerStyle = {
  ...baseStyles,
  padding: "2rem",
};

const dashboardInnerContainerStyle = {
  maxWidth: "1400px",
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "2rem",
};

const headingStyle = {
  fontSize: "2.5rem",
  fontWeight: "800",
  color: "#fff",
  margin: "0",
};

const userInfoStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "0.5rem",
};

const welcomeTextStyle = {
  color: "#d1d5db",
  fontSize: "0.9rem",
};

const profileBadgeStyle = {
  background: "rgba(16, 185, 129, 0.2)",
  color: "#10b981",
  padding: "0.5rem 1rem",
  borderRadius: "20px",
  fontSize: "0.8rem",
  fontWeight: "600",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(16, 185, 129, 0.3)",
};

const tabNavigationStyle = {
  display: "flex",
  background: "rgba(255,255,255,0.1)",
  borderRadius: "12px",
  padding: "0.5rem",
  marginBottom: "2rem",
  backdropFilter: "blur(10px)",
};

const tabStyle = {
  flex: 1,
  padding: "0.75rem 1.5rem",
  background: "transparent",
  color: "#d1d5db",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: "500",
  transition: "all 0.3s ease",
};

const activeTabStyle = {
  ...tabStyle,
  background: "#fff",
  color: "#374151",
  fontWeight: "600",
};

const tabContentStyle = {
  background: "#fff",
  borderRadius: "16px",
  padding: "2rem",
  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
};

const statsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "1.5rem",
  marginBottom: "2rem",
};

const statCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
  padding: "1.5rem",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
};

const statIconStyle = {
  fontSize: "2rem",
};

const statContentStyle = {
  flex: 1,
};

const statNumberStyle = {
  fontSize: "2rem",
  fontWeight: "800",
  color: "#111827",
  margin: "0 0 0.25rem 0",
};

const statLabelStyle = {
  color: "#6b7280",
  fontSize: "0.9rem",
  margin: "0",
};

const sectionHeadingStyle = {
  fontSize: "1.5rem",
  fontWeight: "700",
  color: "#111827",
  marginBottom: "1.5rem",
};

const recentTasksStyle = {
  marginTop: "2rem",
};

const taskPreviewContainerStyle = {
  display: "grid",
  gap: "1rem",
  marginBottom: "1rem",
};

const taskPreviewCardStyle = {
  background: "#f9fafb",
  padding: "1.5rem",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

const taskPreviewHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "0.75rem",
};

const taskPreviewTitleStyle = {
  fontSize: "1.1rem",
  fontWeight: "600",
  color: "#111827",
  margin: "0",
};

const taskPreviewDescStyle = {
  color: "#6b7280",
  fontSize: "0.9rem",
  marginBottom: "0.75rem",
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
};

const taskPreviewMetaStyle = {
  display: "flex",
  gap: "1rem",
  fontSize: "0.8rem",
  color: "#6b7280",
};

const viewAllButtonStyle = {
  background: "#10b981",
  color: "#fff",
  border: "none",
  padding: "0.75rem 1.5rem",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: "500",
  transition: "all 0.3s ease",
};

const filterContainerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "2rem",
};

const filterButtonsStyle = {
  display: "flex",
  gap: "0.5rem",
};

const filterButtonStyle = {
  padding: "0.5rem 1rem",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.8rem",
  color: "#374151",
  transition: "all 0.2s ease",
};

const activeFilterStyle = {
  ...filterButtonStyle,
  background: "#10b981",
  color: "#fff",
  borderColor: "#10b981",
};

const tasksListContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
};

const taskCardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  transition: "all 0.3s ease",
};

const taskHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "1.5rem 1.5rem 0",
};

const taskTitleSectionStyle = {
  flex: 1,
};

const taskTitleStyle = {
  fontSize: "1.25rem",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 0.75rem 0",
};

const taskBadgesStyle = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
};

const taskActionsStyle = {
  marginLeft: "1rem",
};

const statusSelectStyle = {
  padding: "0.5rem 1rem",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "0.8rem",
  background: "#fff",
  cursor: "pointer",
};

const taskContentStyle = {
  padding: "0 1.5rem 1.5rem",
};

const taskDescriptionStyle = {
  color: "#374151",
  fontSize: "0.95rem",
  lineHeight: "1.6",
  marginBottom: "1.5rem",
};

const taskDetailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "1rem",
  marginBottom: "1.5rem",
  background: "#f9fafb",
  padding: "1rem",
  borderRadius: "8px",
};

const taskDetailItemStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
};

const taskDetailLabelStyle = {
  fontSize: "0.75rem",
  fontWeight: "600",
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const taskDetailValueStyle = {
  fontSize: "0.9rem",
  color: "#111827",
  fontWeight: "500",
};

const additionalRequirementsStyle = {
  marginBottom: "1.5rem",
  padding: "1rem",
  background: "#fef7ed",
  borderRadius: "8px",
  border: "1px solid #fed7aa",
};

const requirementsTitleStyle = {
  fontSize: "0.9rem",
  fontWeight: "600",
  color: "#111827",
  marginBottom: "0.5rem",
};

const requirementsTextStyle = {
  fontSize: "0.9rem",
  color: "#374151",
  lineHeight: "1.5",
  margin: "0",
};

const attachmentSectionStyle = {
  marginBottom: "1.5rem",
  padding: "1rem",
  background: "#f0fdf4",
  borderRadius: "8px",
  border: "1px solid #bbf7d0",
};

const attachmentTitleStyle = {
  fontSize: "0.9rem",
  fontWeight: "600",
  color: "#111827",
  marginBottom: "0.5rem",
};

const pdfLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  color: "#059669",
  textDecoration: "none",
  fontSize: "0.9rem",
  fontWeight: "500",
  transition: "color 0.2s",
};

const contactSectionStyle = {
  marginBottom: "1.5rem",
  padding: "1rem",
  background: "#eff6ff",
  borderRadius: "8px",
  border: "1px solid #93c5fd",
};

const contactTitleStyle = {
  fontSize: "0.9rem",
  fontWeight: "600",
  color: "#111827",
  marginBottom: "0.75rem",
};

const contactDetailsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const contactItemStyle = {
  display: "flex",
  gap: "0.75rem",
  alignItems: "center",
};

const contactLabelStyle = {
  fontSize: "0.8rem",
  fontWeight: "500",
  color: "#374151",
  minWidth: "60px",
};

const contactLinkStyle = {
  color: "#2563eb",
  textDecoration: "none",
  fontSize: "0.9rem",
  fontWeight: "500",
};

const progressSectionStyle = {
  padding: "1rem",
  background: "#f9fafb",
  borderRadius: "8px",
};

const progressHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "0.5rem",
};

const progressLabelStyle = {
  fontSize: "0.8rem",
  fontWeight: "600",
  color: "#374151",
};

const progressPercentStyle = {
  fontSize: "0.8rem",
  fontWeight: "600",
  color: "#10b981",
};

const progressBarStyle = {
  height: "8px",
  background: "#e5e7eb",
  borderRadius: "4px",
  overflow: "hidden",
};

const progressFillStyle = {
  height: "100%",
  background: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
  borderRadius: "4px",
  transition: "width 0.3s ease",
};

const emptyStateStyle = {
  textAlign: "center",
  padding: "3rem",
  color: "#6b7280",
};

const emptyIconStyle = {
  fontSize: "4rem",
  marginBottom: "1rem",
};

const emptyTitleStyle = {
  fontSize: "1.25rem",
  fontWeight: "600",
  color: "#111827",
  marginBottom: "0.5rem",
};

const emptyDescStyle = {
  fontSize: "0.9rem",
  color: "#6b7280",
};

const analyticsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "2rem",
};

const analyticsCardStyle = {
  background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
  padding: "2rem",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  textAlign: "center",
};

const completionRateStyle = {
  fontSize: "3rem",
  fontWeight: "800",
  color: "#059669",
  margin: "1rem 0",
};

const responseTimeStyle = {
  fontSize: "3rem",
  fontWeight: "800",
  color: "#10b981",
  margin: "1rem 0",
};

const monthlyTasksStyle = {
  fontSize: "3rem",
  fontWeight: "800",
  color: "#f59e0b",
  margin: "1rem 0",
};

const loadingContainerStyle = {
  ...baseStyles,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const loadingContentStyle = {
  textAlign: "center",
  color: "#fff",
};

const spinnerStyle = {
  display: "inline-block",
  width: "40px",
  height: "40px",
  border: "4px solid rgba(255, 255, 255, 0.3)",
  borderTopColor: "#fff",
  borderRadius: "50%",
  animation: "spin 1s ease-in-out infinite",
  margin: "0 auto",
};

const loadingTextStyle = {
  marginTop: "1rem",
  fontSize: "1.125rem",
  color: "#d1d5db",
};

const errorContainerStyle = {
  ...baseStyles,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
};

const errorContentStyle = {
  background: "#fff",
  padding: "2rem",
  borderRadius: "12px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
  textAlign: "center",
  maxWidth: "400px",
  width: "100%",
};

const errorHeadingStyle = {
  fontSize: "1.5rem",
  fontWeight: "bold",
  color: "#dc2626",
  marginBottom: "1rem",
};

const errorTextStyle = {
  color: "#374151",
  marginBottom: "1.5rem",
};

const loginButtonStyle = {
  padding: "0.75rem 1.5rem",
  background: "#10b981",
  color: "#fff",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: "500",
  transition: "all 0.3s ease",
};

const buyerInfoSectionStyle = {
  marginBottom: "1.5rem",
  padding: "1rem",
  background: "#f0f9ff",
  borderRadius: "8px",
  border: "1px solid #bae6fd",
};

const buyerInfoTitleStyle = {
  fontSize: "0.9rem",
  fontWeight: "600",
  color: "#111827",
  marginBottom: "0.75rem",
};

const buyerInfoDetailsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  marginBottom: "0.75rem",
};

const buyerInfoItemStyle = {
  display: "flex",
  gap: "0.5rem",
  alignItems: "center",
};

const buyerInfoLabelStyle = {
  fontSize: "0.8rem",
  fontWeight: "500",
  color: "#374151",
  minWidth: "60px",
};

const buyerInfoValueStyle = {
  fontSize: "0.9rem",
  fontWeight: "500",
  color: "#111827",
};

const contactButtonsContainerStyle = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
};

const contactActionButtonStyle = {
  padding: "0.5rem 1rem",
  background: "#10b981",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: "500",
  transition: "all 0.2s ease",
};
