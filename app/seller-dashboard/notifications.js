/* Notifications.module.css */

.notificationsPage {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 0;
}

.loadingContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: #64748b;
}

.spinner {
  animation: spin 1s linear infinite;
  color: #3b82f6;
  margin-bottom: 16px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Header Styles */
.header {
  background: white;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: 16px;
}

.backButton {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.backButton:hover {
  background-color: #f1f5f9;
  color: #334155;
}

.headerTitle {
  display: flex;
  align-items: center;
  gap: 12px;
}

.headerTitle h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.unreadBadge {
  background: #ef4444;
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
}

.headerActions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.markAllReadButton,
.clearAllButton {
  background: none;
  border: 1px solid #e2e8f0;
  color: #64748b;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.markAllReadButton:hover {
  background-color: #f8fafc;
  border-color: #3b82f6;
  color: #3b82f6;
}

.clearAllButton:hover {
  background-color: #fef2f2;
  border-color: #ef4444;
  color: #ef4444;
}

/* Filter Tabs */
.filterTabs {
  background: white;
  padding: 0 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  gap: 0;
  overflow-x: auto;
}

.filterTab {
  background: none;
  border: none;
  padding: 16px 20px;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
  position: relative;
}

.filterTab:hover {
  color: #3b82f6;
  background-color: #f8fafc;
}

.filterTab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.filterCount {
  background: #e2e8f0;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 8px;
  min-width: 18px;
  text-align: center;
}

.filterTab.active .filterCount {
  background: #dbeafe;
  color: #3b82f6;
}

/* Notifications List */
.notificationsList {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.notificationCard {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 12px;
  display: flex;
  gap: 16px;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
  position: relative;
}

.notificationCard:hover {
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.notificationCard.unread {
  border-left: 4px solid #3b82f6;
  background: linear-gradient(to right, #f8fafc, white);
}

.notificationIcon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notificationContent {
  flex: 1;
  min-width: 0;
}

.notificationHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}

.notificationTitle {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  line-height: 1.3;
}

.notificationCard.unread .notificationTitle {
  color: #1e293b;
}

.notificationActions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.notificationCard:hover .notificationActions {
  opacity: 1;
}

.markReadButton,
.deleteButton {
  background: none;
  border: none;
  color: #64748b;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.markReadButton:hover {
  background-color: #dbeafe;
  color: #3b82f6;
}

.deleteButton:hover {
  background-color: #fef2f2;
  color: #ef4444;
}

.notificationDescription {
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.notificationFooter {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notificationTime {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.unreadDot {
  width: 8px;
  height: 8px;
  background: #3b82f6;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Empty State */
.emptyState {
  text-align: center;
  padding: 64px 24px;
  color: #64748b;
}

.emptyState svg {
  color: #cbd5e1;
  margin-bottom: 24px;
}

.emptyState h3 {
  font-size: 20px;
  font-weight: 600;
  color: #475569;
  margin: 0 0 8px 0;
}

.emptyState p {
  font-size: 16px;
  color: #64748b;
  margin: 0;
  max-width: 400px;
  margin: 0 auto;
  line-height: 1.5;
}

/* Modal Styles */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.confirmModal {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modalHeader {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.warningIcon {
  color: #f59e0b;
}

.modalHeader h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.confirmModal p {
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 24px;
}

.modalActions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancelButton,
.confirmButton {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
}

.cancelButton {
  background: white;
  border-color: #e2e8f0;
  color: #64748b;
}

.cancelButton:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.confirmButton {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
}

.confirmButton:hover {
  background: #dc2626;
  border-color: #dc2626;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header {
    padding: 16px 20px;
  }

  .headerTitle h1 {
    font-size: 20px;
  }

  .headerActions {
    gap: 8px;
  }

  .markAllReadButton,
  .clearAllButton {
    padding: 6px 12px;
    font-size: 13px;
  }

  .filterTabs {
    padding: 0 20px;
  }

  .filterTab {
    padding: 12px 16px;
    font-size: 13px;
  }

  .notificationsList {
    padding: 16px 20px;
  }

  .notificationCard {
    padding: 16px;
    gap: 12px;
  }

  .notificationIcon {
    width: 40px;
    height: 40px;
  }

  .notificationTitle {
    font-size: 15px;
  }

  .notificationDescription {
    font-size: 13px;
  }

  .emptyState {
    padding: 48px 20px;
  }

  .emptyState h3 {
    font-size: 18px;
  }

  .emptyState p {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 12px 16px;
  }

  .headerActions {
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }

  .markAllReadButton,
  .clearAllButton {
    font-size: 12px;
    padding: 4px 8px;
  }

  .filterTabs {
    padding: 0 16px;
  }

  .notificationsList {
    padding: 12px 16px;
  }

  .confirmModal {
    margin: 20px;
    padding: 20px;
  }

  .modalActions {
    flex-direction: column-reverse;
    gap: 8px;
  }

  .cancelButton,
  .confirmButton {
    width: 100%;
    justify-content: center;
  }
}