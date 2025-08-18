/* seller-payments.module.css */

/* Base Styles */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header Styles */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.header .actionButton {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.header .actionButton:hover {
  background: #2563eb;
}

/* Table Styles */
.table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 32px;
}

.table th,
.table td {
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  text-align: left;
}

.table th {
  background: #f9fafb;
  font-weight: 600;
  color: #111827;
}

.table tr {
  transition: background 0.2s;
}

.table tr:hover {
  background: #f1f5f9;
}

/* Pagination Styles */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.paginationButton {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.paginationButton:hover:not(:disabled) {
  border-color: #9ca3af;
  background: #f9fafb;
}

.paginationButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 16px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header h1 {
    font-size: 24px;
  }

  .table th,
  .table td {
    padding: 10px 12px;
    font-size: 14px;
  }

  .paginationButton {
    padding: 8px 12px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .header .actionButton {
    padding: 8px 16px;
    font-size: 12px;
  }

  .table th,
  .table td {
    padding: 8px 10px;
    font-size: 12px;
  }

  .paginationButton {
    padding: 6px 10px;
    font-size: 10px;
  }
}