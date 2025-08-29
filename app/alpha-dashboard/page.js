'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AlphaDashboard() {
  const [alphaData, setAlphaData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('alphaToken');
      const alphaInfo = localStorage.getItem('alphaData');

      if (!token || !alphaInfo) {
        router.push('/alpha-login');
        return;
      }

      try {
        const parsedAlphaInfo = JSON.parse(alphaInfo);
        setAlphaData(parsedAlphaInfo);

        const res = await fetch('/api/alpha/assignments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ alphaName: parsedAlphaInfo.name })
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || 'Failed to fetch assignments');
        }

        setAssignments(result.assignments);

      } catch (err) {
        console.error('Error fetching assignments:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Loading State
  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={loadingContentStyle}>
          <div style={spinnerStyle}></div>
          <p style={loadingTextStyle}>Loading your assignments...</p>
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
          <button onClick={() => router.push('/alpha-login')} style={loginButtonStyle}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Main Dashboard Content
  return (
    <div style={dashboardContainerStyle}>
      <div style={dashboardInnerContainerStyle}>
        <h1 style={headingStyle}>
          {alphaData?.name}'s Dashboard
        </h1>

        <div style={tableWrapperStyle}>
          <div style={tableHeaderContainerStyle}>
            <h2 style={tableHeadingStyle}>Assigned Tasks</h2>
          </div>
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead style={tableHeadStyle}>
                <tr>
                  <th style={tableHeaderCellStyle}>Title</th>
                  <th style={tableHeaderCellStyle}>Type</th>
                  <th style={tableHeaderCellStyle}>Status</th>
                  <th style={tableHeaderCellStyle}>Buyer</th>
                  <th style={tableHeaderCellStyle}>Deadline</th>
                  <th style={tableHeaderCellStyle}>Budget</th>
                  <th style={tableHeaderCellStyle}>Assigned By</th>
                  <th style={tableHeaderCellStyle}>Description</th>
                  <th style={tableHeaderCellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody style={tableBodyStyle}>
                {assignments.length > 0 ? (
                  assignments.map((assignment) => (
                    <tr key={assignment._id} style={tableRowStyle}>
                      <td style={tableCellStyle}>{assignment.title}</td>
                      <td style={tableCellStyle}>{assignment.type}</td>
                      <td style={tableCellStyle}>
                        <span style={getStatusBadgeStyle(assignment.status)}>
                          {assignment.status}
                        </span>
                      </td>
                      <td style={tableCellStyle}>{assignment.buyerName}</td>
                      <td style={tableCellStyle}>{new Date(assignment.deadline).toLocaleDateString()}</td>
                      <td style={tableCellStyle}>${assignment.budget}</td>
                      <td style={tableCellStyle} title={assignment.assignedByEmail}>{assignment.assignedBy}</td>
                      <td style={descriptionCellStyle} title={assignment.description}>{assignment.description}</td>
                      <td style={actionCellStyle}>
                        {assignment.pdfUrl && (
                          <a href={assignment.pdfUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                            View PDF
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={noAssignmentsCellStyle}>
                      No assignments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Styles
const baseStyles = {
  fontFamily: '"Segoe UI", sans-serif',
  background: '#f4f7f9',
  minHeight: '100vh',
};

const dashboardContainerStyle = {
  ...baseStyles,
  padding: '2rem',
};

const dashboardInnerContainerStyle = {
  maxWidth: '1280px',
  margin: '0 auto',
};

const headingStyle = {
  fontSize: '2.5rem',
  fontWeight: '800',
  color: '#333',
  marginBottom: '1.5rem',
  textAlign: 'center',
};

const tableWrapperStyle = {
  background: '#fff',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  overflow: 'hidden',
};

const tableHeaderContainerStyle = {
  padding: '1.5rem',
};

const tableHeadingStyle = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: '#444',
  marginBottom: '1rem',
};

const tableContainerStyle = {
  overflowX: 'auto',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
};

const tableHeadStyle = {
  background: '#f8f9fa',
  borderBottom: '2px solid #e9ecef',
};

const tableHeaderCellStyle = {
  padding: '1rem 1.5rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: '600',
  color: '#6c757d',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tableBodyStyle = {
  background: '#fff',
  borderBottom: '1px solid #dee2e6',
};

const tableRowStyle = {
  transition: 'background-color 0.2s',
};
tableRowStyle[':hover'] = {
  backgroundColor: '#f1f3f5',
};

const tableCellStyle = {
  padding: '1rem 1.5rem',
  fontSize: '0.875rem',
  color: '#495057',
  whiteSpace: 'nowrap',
};

const descriptionCellStyle = {
  ...tableCellStyle,
  maxWidth: '250px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const actionCellStyle = {
  ...tableCellStyle,
  textAlign: 'right',
};

const linkStyle = {
  color: '#007bff',
  textDecoration: 'none',
  fontWeight: '600',
  transition: 'color 0.2s',
};
linkStyle[':hover'] = {
  color: '#0056b3',
};

const noAssignmentsCellStyle = {
  padding: '2rem',
  textAlign: 'center',
  color: '#6c757d',
  fontSize: '1rem',
};

const loadingContainerStyle = {
  ...baseStyles,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const loadingContentStyle = {
  textAlign: 'center',
};

const spinnerStyle = {
  display: 'inline-block',
  width: '40px',
  height: '40px',
  border: '4px solid rgba(0, 0, 0, 0.1)',
  borderTopColor: '#007bff',
  borderRadius: '50%',
  animation: 'spin 1s ease-in-out infinite',
  margin: '0 auto',
};

const loadingTextStyle = {
  marginTop: '1rem',
  fontSize: '1.125rem',
  color: '#6c757d',
};

// CSS-in-JS Animation
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = `@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`;
document.head.appendChild(styleSheet);

const errorContainerStyle = {
  ...baseStyles,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
};

const errorContentStyle = {
  background: '#fff',
  padding: '2rem',
  borderRadius: '12px',
  boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
  textAlign: 'center',
  maxWidth: '400px',
  width: '100%',
};

const errorHeadingStyle = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#dc3545',
  marginBottom: '1rem',
};

const errorTextStyle = {
  color: '#495057',
};

const loginButtonStyle = {
  marginTop: '1.5rem',
  padding: '0.75rem 1.5rem',
  background: '#007bff',
  color: '#fff',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};
loginButtonStyle[':hover'] = {
  backgroundColor: '#0056b3',
};

function getStatusBadgeStyle(status) {
  let backgroundColor = '#e9ecef';
  let color = '#495057';

  if (status === 'in-progress') {
    backgroundColor = '#cce5ff';
    color = '#004085';
  } else if (status === 'completed') {
    backgroundColor = '#d4edda';
    color = '#155724';
  } else {
    backgroundColor = '#fff3cd';
    color = '#856404';
  }

  return {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    borderRadius: '9999px',
    backgroundColor,
    color,
  };
}