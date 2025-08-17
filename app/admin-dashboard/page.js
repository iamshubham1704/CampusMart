// app/admin-dashboard/page.js
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, buyer, seller
  const [adminData, setAdminData] = useState(null);
  
  // ADD: Reports stats state
  const [reportsStats, setReportsStats] = useState({
    pending: 0,
    'in-progress': 0,
    resolved: 0,
    closed: 0,
    total: 0
  });
  
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem("adminToken");
    const admin = localStorage.getItem("adminData");

    if (!token || !admin) {
      router.push("/admin-login");
      return;
    }

    try {
      const adminInfo = JSON.parse(admin);
      if (adminInfo.role !== "admin") {
        router.push("/admin-login");
        return;
      }
      setAdminData(adminInfo);
      fetchData();
    } catch (error) {
      console.error("Error parsing admin data:", error);
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");
      router.push("/admin-login");
    }
  }, [filter, router]);

  // ADD: Fetch reports data function
  const fetchReportsData = async (token) => {
    try {
      const response = await fetch('/api/admin/reports?limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setReportsStats(data.statistics.status);
      }
    } catch (error) {
      console.error('Error fetching reports data:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");

      // Fetch users and stats in parallel
      const [usersResponse, statsResponse] = await Promise.all([
        fetch(`/api/admin/users${filter !== "all" ? `?type=${filter}` : ""}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("/api/admin/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const usersData = await usersResponse.json();
      const statsData = await statsResponse.json();

      if (usersResponse.ok) {
        setUsers(usersData.data.users);
      } else {
        setError(usersData.error || "Failed to fetch users");
      }

      if (statsResponse.ok) {
        setStats(statsData.data);
      }

      // ADD: Fetch reports data
      await fetchReportsData(token);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, userType, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? "activate" : "ban";

    if (!confirm(`Are you sure you want to ${action} this ${userType}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");

      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          userType,
          isActive: newStatus,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the user in the local state
        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, isActive: newStatus } : user
          )
        );

        alert(`User ${newStatus ? "activated" : "banned"} successfully!`);
      } else {
        alert(data.error || "Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Network error. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    router.push("/admin-login");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.2rem",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        padding: "1rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "white",
          padding: "1rem 2rem",
          marginBottom: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ margin: 0, color: "#333" }}>Admin Dashboard</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ color: "#666" }}>Welcome, {adminData?.name}</span>
          <button
            onClick={() => router.push("/admin-dashboard/management")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "0.5rem",
            }}
          >
            Manage Content
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "#fee",
            color: "#c33",
            padding: "1rem",
            borderRadius: "4px",
            marginBottom: "2rem",
            border: "1px solid #fcc",
          }}
        >
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#007bff" }}>
              Total Users
            </h3>
            <p
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                margin: 0,
                color: "#333",
              }}
            >
              {stats.users.totalUsers}
            </p>
            <small style={{ color: "#666" }}>
              {stats.users.totalBuyers} Buyers, {stats.users.totalSellers}{" "}
              Sellers
            </small>
          </div>

          <div
            style={{
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#28a745" }}>
              Active Users
            </h3>
            <p
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                margin: 0,
                color: "#333",
              }}
            >
              {stats.overview.activeUsers}
            </p>
            <small style={{ color: "#666" }}>
              {stats.users.activeBuyers} Buyers, {stats.users.activeSellers}{" "}
              Sellers
            </small>
          </div>

          <div
            style={{
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#dc3545" }}>
              Inactive Users
            </h3>
            <p
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                margin: 0,
                color: "#333",
              }}
            >
              {stats.overview.inactiveUsers}
            </p>
            <small style={{ color: "#666" }}>
              {stats.users.inactiveBuyers} Buyers, {stats.users.inactiveSellers}{" "}
              Sellers
            </small>
          </div>

          <div
            style={{
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#ffc107" }}>
              New This Week
            </h3>
            <p
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                margin: 0,
                color: "#333",
              }}
            >
              {stats.users.newUsersThisWeek}
            </p>
            <small style={{ color: "#666" }}>
              {stats.users.newBuyersThisWeek} Buyers,{" "}
              {stats.users.newSellersThisWeek} Sellers
            </small>
          </div>
        </div>
      )}

      {/* ADD: Reports Management Card */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid #e0e0e0',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{
            backgroundColor: '#6f42c1',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '8px',
            marginRight: '1rem'
          }}>
            📋
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#333' }}>Reports Management</h3>
            <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
              User reports and issues
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
              {reportsStats.pending || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>
              Pending
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0dcaf0' }}>
              {reportsStats['in-progress'] || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>
              In Progress
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#198754' }}>
              {reportsStats.resolved || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>
              Resolved
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6c757d' }}>
              {reportsStats.closed || 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase' }}>
              Closed
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => router.push('/admin-dashboard/reports')}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            📋 Manage Reports
          </button>
          <button
            onClick={() => router.push('/admin-dashboard/reports?status=pending')}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#ffc107',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            🚨 Pending Issues
          </button>
        </div>
      </div>

      {/* Users Management */}
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ margin: 0, color: "#333" }}>User Management</h2>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setFilter("all")}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: filter === "all" ? "#007bff" : "#e9ecef",
                color: filter === "all" ? "white" : "#333",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              All Users
            </button>
            <button
              onClick={() => setFilter("buyer")}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: filter === "buyer" ? "#007bff" : "#e9ecef",
                color: filter === "buyer" ? "white" : "#333",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Buyers
            </button>
            <button
              onClick={() => setFilter("seller")}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: filter === "seller" ? "#007bff" : "#e9ecef",
                color: filter === "seller" ? "white" : "#333",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Sellers
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #dee2e6",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    borderBottom: "1px solid #dee2e6",
                    fontWeight: "bold",
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    borderBottom: "1px solid #dee2e6",
                    fontWeight: "bold",
                  }}
                >
                  Email
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    borderBottom: "1px solid #dee2e6",
                    fontWeight: "bold",
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    borderBottom: "1px solid #dee2e6",
                    fontWeight: "bold",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    borderBottom: "1px solid #dee2e6",
                    fontWeight: "bold",
                  }}
                >
                  Joined
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "center",
                    borderBottom: "1px solid #dee2e6",
                    fontWeight: "bold",
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user._id}
                  style={{ borderBottom: "1px solid #dee2e6" }}
                >
                  <td style={{ padding: "0.75rem" }}>{user.name}</td>
                  <td style={{ padding: "0.75rem" }}>{user.email}</td>
                  <td style={{ padding: "0.75rem" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        backgroundColor:
                          user.userType === "buyer" ? "#e7f3ff" : "#fff3cd",
                        color:
                          user.userType === "buyer" ? "#004085" : "#856404",
                        borderRadius: "4px",
                        fontSize: "0.875rem",
                        textTransform: "capitalize",
                      }}
                    >
                      {user.userType}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        backgroundColor: user.isActive ? "#d4edda" : "#f8d7da",
                        color: user.isActive ? "#155724" : "#721c24",
                        borderRadius: "4px",
                        fontSize: "0.875rem",
                      }}
                    >
                      {user.isActive ? "Active" : "Banned"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "0.75rem",
                      color: "#666",
                      fontSize: "0.875rem",
                    }}
                  >
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "0.75rem", textAlign: "center" }}>
                    <button
                      onClick={() =>
                        handleStatusChange(
                          user._id,
                          user.userType,
                          user.isActive
                        )
                      }
                      style={{
                        padding: "0.375rem 0.75rem",
                        backgroundColor: user.isActive ? "#dc3545" : "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      {user.isActive ? "Ban" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "2rem",
                color: "#666",
              }}
            >
              No users found.
            </div>
            )}
        </div>
      </div>
    </div>
  );
}