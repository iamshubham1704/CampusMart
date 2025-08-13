// "use client";
// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Home, MessageSquare, Heart, Star, User, Bell, Settings,
//   LogOut, Package, Plus, ArrowLeft, Save, Eye, EyeOff,
//   Shield, Lock, Globe, Smartphone, Mail, CreditCard,
//   Trash2, AlertTriangle, CheckCircle, Camera, Edit3
// } from 'lucide-react';
// import styles from './SettingsPage.module.css';
// import Link from 'next/link';

// const SettingsPage = () => {
//   const [activeTab, setActiveTab] = useState('settings');
//   const [loading, setLoading] = useState(false);
//   const [sellerData, setSellerData] = useState(null);
//   const [showProfileDropdown, setShowProfileDropdown] = useState(false);
//   const [settingsTab, setSettingsTab] = useState('account');
//   const [showCurrentPassword, setShowCurrentPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [saveMessage, setSaveMessage] = useState('');
//   const router = useRouter();

//   // Form states
//   const [accountForm, setAccountForm] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     bio: '',
//     location: '',
//     college: ''
//   });

//   const [passwordForm, setPasswordForm] = useState({
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: ''
//   });

//   const [notificationSettings, setNotificationSettings] = useState({
//     emailNotifications: true,
//     pushNotifications: true,
//     smsNotifications: false,
//     marketingEmails: false,
//     newMessages: true,
//     listingUpdates: true,
//     salesNotifications: true,
//     weeklyDigest: true
//   });

//   const [privacySettings, setPrivacySettings] = useState({
//     profileVisibility: 'public',
//     showEmail: false,
//     showPhone: false,
//     allowMessages: true,
//     showOnlineStatus: true
//   });

//   // Helper function to get current user from token
//   const getCurrentUser = () => {
//     if (typeof window === 'undefined') return null;

//     const token = localStorage.getItem('token');
//     if (!token) return null;

//     try {
//       const parts = token.split('.');
//       if (parts.length !== 3) {
//         localStorage.removeItem('token');
//         return null;
//       }

//       const payload = JSON.parse(atob(parts[1]));

//       // Check if token is expired
//       if (payload.exp && payload.exp < Date.now() / 1000) {
//         localStorage.removeItem('token');
//         return null;
//       }

//       return {
//         id: payload.sellerId || payload.userId || payload.id || payload.sub || payload.email,
//         name: payload.name || payload.given_name || 'User',
//         email: payload.email || '',
//         picture: payload.picture || null,
//         token
//       };
//     } catch (error) {
//       console.error('Error decoding token:', error);
//       localStorage.removeItem('token');
//       return null;
//     }
//   };

//   // Generate user avatar
//   const generateUserAvatar = (name, profileImage) => {
//     if (profileImage) return profileImage;

//     const initial = name ? name.charAt(0).toUpperCase() : 'U';
//     return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Crect width='36' height='36' fill='%23667eea' rx='18'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='0.35em' fill='%23ffffff' font-size='14' font-family='Arial, sans-serif' font-weight='bold'%3E${initial}%3C/text%3E%3C/svg%3E`;
//   };

//   useEffect(() => {
//     const user = getCurrentUser();
//     if (!user) {
//       router.push('/seller-login');
//       return;
//     }

//     const userData = {
//       _id: user.id,
//       name: user.name,
//       email: user.email,
//       profileImage: user.picture,
//       phone: '+91 98765 43210',
//       bio: 'Passionate seller on CampusMarket',
//       location: 'New Delhi, India',
//       college: 'Delhi University',
//       unreadNotifications: 2
//     };

//     setSellerData(userData);
//     setAccountForm({
//       name: userData.name,
//       email: userData.email,
//       phone: userData.phone,
//       bio: userData.bio,
//       location: userData.location,
//       college: userData.college
//     });
//   }, [router]);

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     router.push('/seller-login');
//   };

//   const toggleProfileDropdown = () => {
//     setShowProfileDropdown(!showProfileDropdown);
//   };

//   const handleProfileAction = (action) => {
//     setShowProfileDropdown(false);

//     switch (action) {
//       case 'profile':
//         router.push('/seller-dashboard/profile-section');
//         break;
//       case 'settings':
//         // Already on settings page
//         break;
//       case 'notifications':
//         router.push('/seller-dashboard/notifications');
//         break;
//       case 'logout':
//         handleLogout();
//         break;
//       default:
//         break;
//     }
//   };

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (!event.target.closest(`.${styles.userProfile}`)) {
//         setShowProfileDropdown(false);
//       }
//     };

//     if (showProfileDropdown) {
//       document.addEventListener('click', handleClickOutside);
//       return () => document.removeEventListener('click', handleClickOutside);
//     }
//   }, [showProfileDropdown]);

//   const handleAccountFormChange = (field, value) => {
//     setAccountForm(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };

//   const handlePasswordFormChange = (field, value) => {
//     setPasswordForm(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };

//   const handleNotificationChange = (setting, value) => {
//     setNotificationSettings(prev => ({
//       ...prev,
//       [setting]: value
//     }));
//   };

//   const handlePrivacyChange = (setting, value) => {
//     setPrivacySettings(prev => ({
//       ...prev,
//       [setting]: value
//     }));
//   };

//   const saveSettings = async (type) => {
//     setLoading(true);
//     setSaveMessage('');

//     try {
//       // Simulate API call
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       if (type === 'account') {
//         setSellerData(prev => ({
//           ...prev,
//           ...accountForm
//         }));
//       }
      
//       setSaveMessage('Settings saved successfully!');
//       setTimeout(() => setSaveMessage(''), 3000);
//     } catch (error) {
//       setSaveMessage('Error saving settings. Please try again.');
//       setTimeout(() => setSaveMessage(''), 3000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const changePassword = async () => {
//     if (passwordForm.newPassword !== passwordForm.confirmPassword) {
//       setSaveMessage('New passwords do not match.');
//       setTimeout(() => setSaveMessage(''), 3000);
//       return;
//     }

//     if (passwordForm.newPassword.length < 6) {
//       setSaveMessage('Password must be at least 6 characters long.');
//       setTimeout(() => setSaveMessage(''), 3000);
//       return;
//     }

//     setLoading(true);
//     setSaveMessage('');

//     try {
//       // Simulate API call
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       setSaveMessage('Password changed successfully!');
//       setPasswordForm({
//         currentPassword: '',
//         newPassword: '',
//         confirmPassword: ''
//       });
//       setTimeout(() => setSaveMessage(''), 3000);
//     } catch (error) {
//       setSaveMessage('Error changing password. Please try again.');
//       setTimeout(() => setSaveMessage(''), 3000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const deleteAccount = async () => {
//     if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
//       setLoading(true);
//       try {
//         // Simulate API call
//         await new Promise(resolve => setTimeout(resolve, 1000));
//         localStorage.removeItem('token');
//         router.push('/seller-login');
//       } catch (error) {
//         setSaveMessage('Error deleting account. Please try again.');
//         setTimeout(() => setSaveMessage(''), 3000);
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   const SettingsSection = ({ title, children, onSave, saveText = "Save Changes" }) => (
//     <div className={styles.settingsSection}>
//       <div className={styles.sectionHeader}>
//         <h3 className={styles.sectionTitle}>{title}</h3>
//         {onSave && (
//           <button 
//             className={styles.saveButton}
//             onClick={onSave}
//             disabled={loading}
//           >
//             <Save size={16} />
//             {loading ? 'Saving...' : saveText}
//           </button>
//         )}
//       </div>
//       <div className={styles.sectionContent}>
//         {children}
//       </div>
//     </div>
//   );

//   const FormGroup = ({ label, children, description }) => (
//     <div className={styles.formGroup}>
//       <label className={styles.formLabel}>{label}</label>
//       {children}
//       {description && <p className={styles.formDescription}>{description}</p>}
//     </div>
//   );

//   const Switch = ({ checked, onChange, label, description }) => (
//     <div className={styles.switchGroup}>
//       <div className={styles.switchContent}>
//         <div className={styles.switchLabel}>{label}</div>
//         {description && <div className={styles.switchDescription}>{description}</div>}
//       </div>
//       <label className={styles.switch}>
//         <input
//           type="checkbox"
//           checked={checked}
//           onChange={(e) => onChange(e.target.checked)}
//         />
//         <span className={styles.slider}></span>
//       </label>
//     </div>
//   );

//   return (
//     <div className={styles.dashboard}>
//       {/* Header */}
//       <header className={styles.header}>
//         <div className={styles.headerContent}>
//           <div className={styles.logoSection}>
//             <div className={styles.logo}>
//               <span className={styles.logoText}>Campus</span>
//               <span className={styles.logoTextSecondary}>Market</span>
//             </div>
//           </div>

//           <div className={styles.headerActions}>
//             <div>
//               <input
//                 type="text"
//                 placeholder="Search products, colleges, categories..."
//                 className={styles.searchInput}
//               />
//             </div>

//             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//               <button className={styles.sellButton} onClick={() => router.push('/seller-dashboard/create-listing')}>
//                 <Plus size={20} />
//                 Sell Item
//               </button>

//               <div className={styles.profileSection}>
//                 <div
//                   className={styles.userProfile}
//                   onClick={toggleProfileDropdown}
//                   title="Profile Menu"
//                 >
//                   <img
//                     src={generateUserAvatar(sellerData?.name, sellerData?.profileImage)}
//                     alt={`${sellerData?.name || 'User'}'s Profile`}
//                     className={styles.userAvatar}
//                   />
//                   <span className={styles.userName}>{sellerData?.name || 'User'}</span>
//                   <svg
//                     className={`${styles.dropdownArrow} ${showProfileDropdown ? styles.dropdownArrowOpen : ''}`}
//                     width="12"
//                     height="12"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                   >
//                     <polyline points="6,9 12,15 18,9"></polyline>
//                   </svg>
//                 </div>

//                 {showProfileDropdown && (
//                   <>
//                     <div className={styles.profileDropdownOverlay} onClick={() => setShowProfileDropdown(false)}></div>
//                     <div className={styles.profileDropdown}>
//                       <div className={styles.profileHeader}>
//                         <img
//                           src={generateUserAvatar(sellerData?.name, sellerData?.profileImage)}
//                           alt="Profile"
//                           className={styles.profileDropdownAvatar}
//                         />
//                         <div className={styles.profileInfo}>
//                           <div className={styles.profileName}>{sellerData?.name || 'User'}</div>
//                           <div className={styles.profileEmail}>{sellerData?.email || ''}</div>
//                         </div>
//                       </div>

//                       <div className={styles.profileDivider}></div>

//                       <div className={styles.profileMenuItems}>
//                         <Link href="/seller-dashboard/profile-section">
//                           <button
//                             className={styles.profileMenuItem}
//                             onClick={() => handleProfileAction('profile')}
//                           >
//                             <User size={16} />
//                             <span>My Profile</span>
//                           </button>
//                         </Link>

//                         <button
//                           className={`${styles.profileMenuItem} ${styles.active}`}
//                           onClick={() => handleProfileAction('settings')}
//                         >
//                           <Settings size={16} />
//                           <span>Account Settings</span>
//                         </button>

//                         <button
//                           className={styles.profileMenuItem}
//                           onClick={() => handleProfileAction('notifications')}
//                         >
//                           <Bell size={16} />
//                           <span>Notifications</span>
//                           {sellerData?.unreadNotifications > 0 && (
//                             <span className={styles.notificationCount}>
//                               {sellerData.unreadNotifications}
//                             </span>
//                           )}
//                         </button>

//                         <div className={styles.profileDivider}></div>

//                         <button
//                           className={`${styles.profileMenuItem} ${styles.logoutMenuItem}`}
//                           onClick={() => handleProfileAction('logout')}
//                         >
//                           <LogOut size={16} />
//                           <span>Sign Out</span>
//                         </button>
//                       </div>
//                     </div>
//                   </>
//                 )}
//               </div>

//               <button className={styles.messagesButton}>
//                 <MessageSquare size={16} />
//                 Messages
//               </button>
//             </div>
//           </div>
//         </div>
//       </header>

//       <div className={styles.mainLayout}>
//         {/* Sidebar */}
//         <aside className={styles.sidebar}>
//           <nav className={styles.nav}>
//             <div className={styles.navList}>
//               <button
//                 onClick={() => router.push('/seller-dashboard')}
//                 className={styles.navItem}
//               >
//                 <Home size={20} />
//                 <span>Home</span>
//               </button>

//               <button
//                 onClick={() => router.push('/seller-dashboard/products')}
//                 className={styles.navItem}
//               >
//                 <Package size={20} />
//                 <span>My Products</span>
//               </button>

//               <button
//                 onClick={() => router.push('/seller-dashboard/notifications')}
//                 className={styles.navItem}
//               >
//                 <Bell size={20} />
//                 <span>Notifications</span>
//                 {sellerData?.unreadNotifications > 0 && (
//                   <span className={styles.navNotificationBadge}>
//                     {sellerData.unreadNotifications}
//                   </span>
//                 )}
//               </button>

//               <button 
//                 className={`${styles.navItem} ${styles.active}`}
//               >
//                 <Settings size={20} />
//                 <span>Settings</span>
//               </button>
//             </div>

//             <div className={styles.navDivider}>
//               <button className={`${styles.navItem} ${styles.logoutButton}`} onClick={handleLogout}>
//                 <LogOut size={20} />
//                 <span>Sign Out</span>
//               </button>
//             </div>
//           </nav>
//         </aside>

//         {/* Main Content */}
//         <main className={styles.mainContent}>
//           {/* Header Section */}
//           <div className={styles.pageHeader}>
//             <div className={styles.pageHeaderLeft}>
//               <button 
//                 className={styles.backButton}
//                 onClick={() => router.push('/seller-dashboard')}
//               >
//                 <ArrowLeft size={20} />
//               </button>
//               <div>
//                 <h1 className={styles.pageTitle}>Account Settings</h1>
//                 <p className={styles.pageSubtitle}>Manage your account preferences and security</p>
//               </div>
//             </div>
//           </div>

//           {/* Save Message */}
//           {saveMessage && (
//             <div className={`${styles.saveMessage} ${saveMessage.includes('Error') ? styles.error : styles.success}`}>
//               <CheckCircle size={16} />
//               {saveMessage}
//             </div>
//           )}

//           {/* Settings Tabs */}
//           <div className={styles.settingsTabs}>
//             <button
//               className={`${styles.settingsTab} ${settingsTab === 'account' ? styles.active : ''}`}
//               onClick={() => setSettingsTab('account')}
//             >
//               <User size={16} />
//               Account
//             </button>
//             <button
//               className={`${styles.settingsTab} ${settingsTab === 'security' ? styles.active : ''}`}
//               onClick={() => setSettingsTab('security')}
//             >
//               <Lock size={16} />
//               Security
//             </button>
//             <button
//               className={`${styles.settingsTab} ${settingsTab === 'notifications' ? styles.active : ''}`}
//               onClick={() => setSettingsTab('notifications')}
//             >
//               <Bell size={16} />
//               Notifications
//             </button>
//             <button
//               className={`${styles.settingsTab} ${settingsTab === 'privacy' ? styles.active : ''}`}
//               onClick={() => setSettingsTab('privacy')}
//             >
//               <Shield size={16} />
//               Privacy
//             </button>
//           </div>

//           {/* Settings Content */}
//           <div className={styles.settingsContent}>
//             {/* Account Settings */}
//             {settingsTab === 'account' && (
//               <div className={styles.tabContent}>
//                 <SettingsSection 
//                   title="Profile Information"
//                   onSave={() => saveSettings('account')}
//                 >
//                   <div className={styles.profileImageSection}>
//                     <div className={styles.profileImageContainer}>
//                       <img
//                         src={generateUserAvatar(sellerData?.name, sellerData?.profileImage)}
//                         alt="Profile"
//                         className={styles.profileImage}
//                       />
//                       <button className={styles.changePhotoButton}>
//                         <Camera size={16} />
//                         Change Photo
//                       </button>
//                     </div>
//                   </div>

//                   <div className={styles.formGrid}>
//                     <FormGroup label="Full Name">
//                       <input
//                         type="text"
//                         value={accountForm.name}
//                         onChange={(e) => handleAccountFormChange('name', e.target.value)}
//                         className={styles.formInput}
//                         placeholder="Enter your full name"
//                       />
//                     </FormGroup>

//                     <FormGroup label="Email Address">
//                       <input
//                         type="email"
//                         value={accountForm.email}
//                         onChange={(e) => handleAccountFormChange('email', e.target.value)}
//                         className={styles.formInput}
//                         placeholder="Enter your email"
//                       />
//                     </FormGroup>

//                     <FormGroup label="Phone Number">
//                       <input
//                         type="tel"
//                         value={accountForm.phone}
//                         onChange={(e) => handleAccountFormChange('phone', e.target.value)}
//                         className={styles.formInput}
//                         placeholder="Enter your phone number"
//                       />
//                     </FormGroup>

//                     <FormGroup label="College/University">
//                       <input
//                         type="text"
//                         value={accountForm.college}
//                         onChange={(e) => handleAccountFormChange('college', e.target.value)}
//                         className={styles.formInput}
//                         placeholder="Enter your college"
//                       />
//                     </FormGroup>
//                   </div>

//                   <FormGroup label="Location">
//                     <input
//                       type="text"
//                       value={accountForm.location}
//                       onChange={(e) => handleAccountFormChange('location', e.target.value)}
//                       className={styles.formInput}
//                       placeholder="Enter your location"
//                     />
//                   </FormGroup>

//                   <FormGroup label="Bio" description="Tell other users about yourself">
//                     <textarea
//                       value={accountForm.bio}
//                       onChange={(e) => handleAccountFormChange('bio', e.target.value)}
//                       className={styles.formTextarea}
//                       placeholder="Write a short bio..."
//                       rows={3}
//                     />
//                   </FormGroup>
//                 </SettingsSection>
//               </div>
//             )}

//             {/* Security Settings */}
//             {settingsTab === 'security' && (
//               <div className={styles.tabContent}>
//                 <SettingsSection 
//                   title="Change Password"
//                   onSave={changePassword}
//                   saveText="Update Password"
//                 >
//                   <FormGroup label="Current Password">
//                     <div className={styles.passwordInput}>
//                       <input
//                         type={showCurrentPassword ? 'text' : 'password'}
//                         value={passwordForm.currentPassword}
//                         onChange={(e) => handlePasswordFormChange('currentPassword', e.target.value)}
//                         className={styles.formInput}
//                         placeholder="Enter current password"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowCurrentPassword(!showCurrentPassword)}
//                         className={styles.passwordToggle}
//                       >
//                         {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//                       </button>
//                     </div>
//                   </FormGroup>

//                   <FormGroup label="New Password">
//                     <div className={styles.passwordInput}>
//                       <input
//                         type={showNewPassword ? 'text' : 'password'}
//                         value={passwordForm.newPassword}
//                         onChange={(e) => handlePasswordFormChange('newPassword', e.target.value)}
//                         className={styles.formInput}
//                         placeholder="Enter new password"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowNewPassword(!showNewPassword)}
//                         className={styles.passwordToggle}
//                       >
//                         {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//                       </button>
//                     </div>
//                   </FormGroup>

//                   <FormGroup label="Confirm New Password">
//                     <div className={styles.passwordInput}>
//                       <input
//                         type={showConfirmPassword ? 'text' : 'password'}
//                         value={passwordForm.confirmPassword}
//                         onChange={(e) => handlePasswordFormChange('confirmPassword', e.target.value)}
//                         className={styles.formInput}
//                         placeholder="Confirm new password"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                         className={styles.passwordToggle}
//                       >
//                         {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//                       </button>
//                     </div>
//                   </FormGroup>
//                 </SettingsSection>

//                 <SettingsSection title="Account Security">
//                   <div className={styles.securityOptions}>
//                     <div className={styles.securityItem}>
//                       <Smartphone className={styles.securityIcon} />
//                       <div className={styles.securityContent}>
//                         <h4>Two-Factor Authentication</h4>
//                         <p>Add an extra layer of security to your account</p>
//                         <button className={styles.securityButton}>Enable 2FA</button>
//                       </div>
//                     </div>

//                     <div className={styles.securityItem}>
//                       <Mail className={styles.securityIcon} />
//                       <div className={styles.securityContent}>
//                         <h4>Email Verification</h4>
//                         <p>Your email address is verified</p>
//                         <span className={styles.verifiedBadge}>Verified</span>
//                       </div>
//                     </div>
//                   </div>
//                 </SettingsSection>

//                 <SettingsSection title="Danger Zone">
//                   <div className={styles.dangerZone}>
//                     <div className={styles.dangerItem}>
//                       <AlertTriangle className={styles.dangerIcon} />
//                       <div className={styles.dangerContent}>
//                         <h4>Delete Account</h4>
//                         <p>Permanently delete your account and all associated data</p>
//                         <button 
//                           className={styles.deleteButton}
//                           onClick={deleteAccount}
//                         >
//                           <Trash2 size={16} />
//                           Delete Account
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </SettingsSection>
//               </div>
//             )}

//             {/* Notification Settings */}
//             {settingsTab === 'notifications' && (
//               <div className={styles.tabContent}>
//                 <SettingsSection 
//                   title="Notification Preferences"
//                   onSave={() => saveSettings('notifications')}
//                 >
//                   <div className={styles.notificationGroups}>
//                     <div className={styles.notificationGroup}>
//                       <h4 className={styles.groupTitle}>Communication</h4>
//                       <Switch
//                         checked={notificationSettings.emailNotifications}
//                         onChange={(value) => handleNotificationChange('emailNotifications', value)}
//                         label="Email Notifications"
//                         description="Receive notifications via email"
//                       />
//                       <Switch
//                         checked={notificationSettings.pushNotifications}
//                         onChange={(value) => handleNotificationChange('pushNotifications', value)}
//                         label="Push Notifications"
//                         description="Receive push notifications in your browser"
//                       />
//                       <Switch
//                         checked={notificationSettings.smsNotifications}
//                         onChange={(value) => handleNotificationChange('smsNotifications', value)}
//                         label="SMS Notifications"
//                         description="Receive important notifications via SMS"
//                       />
//                     </div>

//                     <div className={styles.notificationGroup}>
//                       <h4 className={styles.groupTitle}>Activity</h4>
//                       <Switch
//                         checked={notificationSettings.newMessages}
//                         onChange={(value) => handleNotificationChange('newMessages', value)}
//                         label="New Messages"
//                         description="Get notified when you receive new messages"
//                       />
//                       <Switch
//                         checked={notificationSettings.listingUpdates}
//                         onChange={(value) => handleNotificationChange('listingUpdates', value)}
//                         label="Listing Updates"
//                         description="Notifications about your listing views and favorites"
//                       />
//                       <Switch
//                         checked={notificationSettings.salesNotifications}
//                         onChange={(value) => handleNotificationChange('salesNotifications', value)}
//                         label="Sales Notifications"
//                         description="Get notified when items are sold"
//                       />
//                     </div>

//                     <div className={styles.notificationGroup}>
//                       <h4 className={styles.groupTitle}>Marketing</h4>
//                       <Switch
//                         checked={notificationSettings.marketingEmails}
//                         onChange={(value) => handleNotificationChange('marketingEmails', value)}
//                         label="Marketing Emails"
//                         description="Receive promotional emails and offers"
//                       />
//                       <Switch
//                         checked={notificationSettings.weeklyDigest}
//                         onChange={(value) => handleNotificationChange('weeklyDigest', value)}
//                         label="Weekly Digest"
//                         description="Weekly summary of your account activity"
//                       />
//                     </div>
//                   </div>
//                 </SettingsSection>
//               </div>
//             )}

//             {/* Privacy Settings */}
//             {settingsTab === 'privacy' && (
//               <div className={styles.tabContent}>
//                 <SettingsSection 
//                   title="Privacy Settings"
//                   onSave={() => saveSettings('privacy')}
//                 >
//                   <FormGroup label="Profile Visibility">
//                     <select
//                       value={privacySettings.profileVisibility}
//                       onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
//                       className={styles.formSelect}
//                     >
//                       <option value="public">Public - Anyone can see your profile</option>
//                       <option value="college">College Only - Only students from your college</option>
//                       <option value="private">Private - Only you can see your profile</option>
//                     </select>
//                   </FormGroup>

//                   <div className={styles.privacyOptions}>
//                     <Switch
//                       checked={privacySettings.showEmail}
//                       onChange={(value) => handlePrivacyChange('showEmail', value)}
//                       label="Show Email Address"
//                       description="Allow other users to see your email address"
//                     />
//                     <Switch
//                       checked={privacySettings.showPhone}
//                       onChange={(value) => handlePrivacyChange('showPhone', value)}
//                       label="Show Phone Number"
//                       description="Display your phone number on your profile"
//                     />
//                     <Switch
//                       checked={privacySettings.allowMessages}
//                       onChange={(value) => handlePrivacyChange('allowMessages', value)}
//                       label="Allow Messages"
//                       description="Let other users send you messages"
//                     />
//                     <Switch
//                       checked={privacySettings.showOnlineStatus}
//                       onChange={(value) => handlePrivacyChange('showOnlineStatus', value)}
//                       label="Show Online Status"
//                       description="Display when you're online to other users"
//                     />
//                   </div>
//                 </SettingsSection>

//                 <SettingsSection title="Data & Privacy">
//                   <div className={styles.dataOptions}>
//                     <div className={styles.dataItem}>
//                       <Globe className={styles.dataIcon} />
//                       <div className={styles.dataContent}>
//                         <h4>Download Your Data</h4>
//                         <p>Get a copy of all your data stored on CampusMarket</p>
//                         <button className={styles.dataButton}>Request Download</button>
//                       </div>
//                     </div>
//                   </div>
//                 </SettingsSection>
//               </div>
//             )}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// export default SettingsPage;


"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Lock, Bell, Shield, Smartphone, Trash2,
  Camera, Save, Eye, EyeOff, Check, X, AlertTriangle,
  Loader2, Upload, Download, LogOut, Monitor, Globe,
  Mail, Phone, MapPin, Calendar, Building2, ChevronRight
} from 'lucide-react';
import styles from './SettingsPage.module.css';
import { userAPI, settingsAPI, getCurrentUser } from '../../utils/api';

const SettingsPage = () => {
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  // State management
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // User data
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    college: '',
    year: '',
    bio: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    messageNotifications: true,
    listingNotifications: true,
    marketingEmails: false,
    weeklyDigest: true,
    instantMessages: true,
    priceAlerts: true
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showLastSeen: true,
    allowSearchEngines: true,
    dataCollection: true
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: '24h'
  });
  
  const [loginSessions, setLoginSessions] = useState([]);
  
  // Success and error messages
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Generate user avatar
  const generateUserAvatar = (name, profileImage) => {
    if (profileImage) return profileImage;
    if (imagePreview) return imagePreview;
    
    const initial = name ? name.charAt(0).toUpperCase() : 'U';
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23667eea' rx='60'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='0.35em' fill='%23ffffff' font-size='48' font-family='Arial, sans-serif' font-weight='bold'%3E${initial}%3C/text%3E%3C/svg%3E`;
  };
  
  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        const user = getCurrentUser();
        if (!user) {
          router.push('/seller-login');
          return;
        }
        
        // Fetch complete user profile
        const profileResponse = await userAPI.getProfile();
        if (profileResponse.success) {
          const profile = profileResponse.data;
          setUserData(profile);
          setProfileForm({
            name: profile.name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            location: profile.location || '',
            college: profile.college || '',
            year: profile.year || '',
            bio: profile.bio || ''
          });
        }
        
        // Load settings if available
        try {
          const settingsResponse = await settingsAPI.getSettings();
          if (settingsResponse.success) {
            const settings = settingsResponse.data;
            setNotificationSettings(prev => ({ ...prev, ...settings.notifications }));
            setPrivacySettings(prev => ({ ...prev, ...settings.privacy }));
            setSecuritySettings(prev => ({ ...prev, ...settings.security }));
          }
        } catch (error) {
          console.log('Settings not available, using defaults');
        }
        
      } catch (error) {
        console.error('Error loading user data:', error);
        setMessage({ type: 'error', text: 'Failed to load user data' });
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [router]);
  
  // Show message helper
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };
  
  // Handle profile image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'Image size must be less than 5MB');
        return;
      }
      
      setProfileImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Upload image if selected
      let imageUrl = userData?.profileImage;
      if (profileImage) {
        const imageResponse = await settingsAPI.uploadProfileImage(profileImage);
        if (imageResponse.success) {
          imageUrl = imageResponse.data.imageUrl;
        }
      }
      
      // Update profile
      const response = await userAPI.updateProfile({
        ...profileForm,
        profileImage: imageUrl
      });
      
      if (response.success) {
        setUserData(prev => ({ ...prev, ...response.data }));
        setProfileImage(null);
        setImagePreview(null);
        showMessage('success', 'Profile updated successfully');
      }
      
    } catch (error) {
      showMessage('error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters');
      return;
    }
    
    try {
      setSaving(true);
      
      const response = await settingsAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      if (response.success) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        showMessage('success', 'Password changed successfully');
      }
      
    } catch (error) {
      showMessage('error', error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle notification settings update
  const handleNotificationUpdate = async (key, value) => {
    try {
      const newSettings = { ...notificationSettings, [key]: value };
      setNotificationSettings(newSettings);
      
      const response = await settingsAPI.updateNotificationPreferences(newSettings);
      if (!response.success) {
        // Revert on error
        setNotificationSettings(notificationSettings);
        showMessage('error', 'Failed to update notification preferences');
      }
    } catch (error) {
      setNotificationSettings(notificationSettings);
      showMessage('error', 'Failed to update notification preferences');
    }
  };
  
  // Handle privacy settings update
  const handlePrivacyUpdate = async (key, value) => {
    try {
      const newSettings = { ...privacySettings, [key]: value };
      setPrivacySettings(newSettings);
      
      const response = await settingsAPI.updatePrivacySettings(newSettings);
      if (!response.success) {
        // Revert on error
        setPrivacySettings(privacySettings);
        showMessage('error', 'Failed to update privacy settings');
      }
    } catch (error) {
      setPrivacySettings(privacySettings);
      showMessage('error', 'Failed to update privacy settings');
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (!confirmDelete) return;
    
    const password = prompt('Please enter your password to confirm account deletion:');
    if (!password) return;
    
    try {
      setSaving(true);
      
      const response = await settingsAPI.deleteAccount({ password });
      if (response.success) {
        localStorage.removeItem('token');
        router.push('/');
        showMessage('success', 'Account deleted successfully');
      }
      
    } catch (error) {
      showMessage('error', error.message || 'Failed to delete account');
    } finally {
      setSaving(false);
    }
  };
  
  // Settings sections configuration
  const settingsSections = [
    { id: 'profile', title: 'Profile', icon: User },
    { id: 'security', title: 'Security', icon: Lock },
    { id: 'notifications', title: 'Notifications', icon: Bell },
    { id: 'privacy', title: 'Privacy', icon: Shield },
    { id: 'sessions', title: 'Login Sessions', icon: Monitor },
    { id: 'danger', title: 'Danger Zone', icon: AlertTriangle }
  ];
  
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={48} className={styles.spinner} />
        <p>Loading settings...</p>
      </div>
    );
  }
  
  return (
    <div className={styles.settingsContainer}>
      {/* Header */}
      <div className={styles.settingsHeader}>
        <button onClick={() => router.back()} className={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.settingsTitle}>Settings</h1>
      </div>
      
      {/* Message Display */}
      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
          <span>{message.text}</span>
        </div>
      )}
      
      <div className={styles.settingsContent}>
        {/* Sidebar */}
        <div className={styles.settingsSidebar}>
          <nav className={styles.settingsNav}>
            {settingsSections.map(section => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`${styles.navItem} ${activeSection === section.id ? styles.active : ''}`}
                >
                  <IconComponent size={20} />
                  <span>{section.title}</span>
                  <ChevronRight size={16} className={styles.chevron} />
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Main Content */}
        <div className={styles.settingsMain}>
          
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Profile Information</h2>
              <p className={styles.sectionDescription}>
                Update your profile information and manage your public presence.
              </p>
              
              <form onSubmit={handleProfileSubmit} className={styles.settingsForm}>
                {/* Profile Image */}
                <div className={styles.profileImageSection}>
                  <div className={styles.profileImageContainer}>
                    <img
                      src={generateUserAvatar(userData?.name, userData?.profileImage)}
                      alt="Profile"
                      className={styles.profileImage}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={styles.imageUploadButton}
                    >
                      <Camera size={16} />
                    </button>
                  </div>
                  <div className={styles.imageUploadInfo}>
                    <p>Click to upload a new profile picture</p>
                    <small>JPG, PNG up to 5MB</small>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className={styles.hiddenInput}
                  />
                </div>
                
                {/* Form Fields */}
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.formLabel}>
                      <User size={16} />
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      className={styles.formInput}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.formLabel}>
                      <Mail size={16} />
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className={styles.formInput}
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="phone" className={styles.formLabel}>
                      <Phone size={16} />
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      className={styles.formInput}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="location" className={styles.formLabel}>
                      <MapPin size={16} />
                      Location
                    </label>
                    <input
                      id="location"
                      type="text"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                      className={styles.formInput}
                      placeholder="Enter your location"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="college" className={styles.formLabel}>
                      <Building2 size={16} />
                      College
                    </label>
                    <input
                      id="college"
                      type="text"
                      value={profileForm.college}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, college: e.target.value }))}
                      className={styles.formInput}
                      placeholder="Enter your college name"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="year" className={styles.formLabel}>
                      <Calendar size={16} />
                      Academic Year
                    </label>
                    <select
                      id="year"
                      value={profileForm.year}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, year: e.target.value }))}
                      className={styles.formSelect}
                    >
                      <option value="">Select year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Faculty">Faculty</option>
                    </select>
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="bio" className={styles.formLabel}>
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    className={styles.formTextarea}
                    placeholder="Tell others about yourself..."
                    rows={4}
                    maxLength={500}
                  />
                  <small className={styles.charCount}>
                    {profileForm.bio.length}/500 characters
                  </small>
                </div>
                
                <button
                  type="submit"
                  disabled={saving}
                  className={styles.saveButton}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
          
          {/* Security Section */}
          {activeSection === 'security' && (
            <div className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Security Settings</h2>
              <p className={styles.sectionDescription}>
                Manage your account security and authentication methods.
              </p>
              
              {/* Change Password */}
              <div className={styles.securityCard}>
                <h3 className={styles.cardTitle}>
                  <Lock size={20} />
                  Change Password
                </h3>
                <form onSubmit={handlePasswordSubmit} className={styles.passwordForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="currentPassword" className={styles.formLabel}>
                      Current Password
                    </label>
                    <div className={styles.passwordInput}>
                      <input
                        id="currentPassword"
                        type={showPassword.current ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className={styles.formInput}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                        className={styles.passwordToggle}
                      >
                        {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="newPassword" className={styles.formLabel}>
                      New Password
                    </label>
                    <div className={styles.passwordInput}>
                      <input
                        id="newPassword"
                        type={showPassword.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className={styles.formInput}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                        className={styles.passwordToggle}
                      >
                        {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="confirmPassword" className={styles.formLabel}>
                      Confirm New Password
                    </label>
                    <div className={styles.passwordInput}>
                      <input
                        id="confirmPassword"
                        type={showPassword.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className={styles.formInput}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className={styles.passwordToggle}
                      >
                        {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={saving}
                    className={styles.saveButton}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className={styles.spinner} />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Update Password
                      </>
                    )}
                  </button>
                </form>
              </div>
              
              {/* Two-Factor Authentication */}
              <div className={styles.securityCard}>
                <h3 className={styles.cardTitle}>
                  <Smartphone size={20} />
                  Two-Factor Authentication
                </h3>
                <p className={styles.cardDescription}>
                  Add an extra layer of security to your account with 2FA.
                </p>
                <div className={styles.securityOption}>
                  <div>
                    <strong>Authenticator App</strong>
                    <p>Use an app like Google Authenticator or Authy</p>
                  </div>
                  <button
                    className={`${styles.toggleButton} ${securitySettings.twoFactorEnabled ? styles.enabled : ''}`}
                  >
                    {securitySettings.twoFactorEnabled ? 'Enabled' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Notification Preferences</h2>
              <p className={styles.sectionDescription}>
                Choose how and when you want to receive notifications.
              </p>
              
              <div className={styles.notificationGroups}>
                <div className={styles.notificationGroup}>
                  <h3 className={styles.groupTitle}>Communication</h3>
                  
                  <div className={styles.notificationItem}>
                    <div className={styles.notificationInfo}>
                      <strong>Email Notifications</strong>
                      <p>Receive notifications via email</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => handleNotificationUpdate('emailNotifications', e.target.checked)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.notificationItem}>
                    <div className={styles.notificationInfo}>
                      <strong>Push Notifications</strong>
                      <p>Receive browser push notifications</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => handleNotificationUpdate('pushNotifications', e.target.checked)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.notificationItem}>
                    <div className={styles.notificationInfo}>
                      <strong>Message Notifications</strong>
                      <p>Get notified about new messages</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.messageNotifications}
                        onChange={(e) => handleNotificationUpdate('messageNotifications', e.target.checked)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>
                
                <div className={styles.notificationGroup}>
                  <h3 className={styles.groupTitle}>Listings & Sales</h3>
                  
                  <div className={styles.notificationItem}>
                    <div className={styles.notificationInfo}>
                      <strong>Listing Notifications</strong>
                      <p>Updates about your listings</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.listingNotifications}
                        onChange={(e) => handleNotificationUpdate('listingNotifications', e.target.checked)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.notificationItem}>
                    <div className={styles.notificationInfo}>
                      <strong>Price Alerts</strong>
                      <p>Notifications about price changes</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.priceAlerts}
                        onChange={(e) => handleNotificationUpdate('priceAlerts', e.target.checked)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>
                
                <div className={styles.notificationGroup}>
                  <h3 className={styles.groupTitle}>Marketing & Updates</h3>
                  
                  <div className={styles.notificationItem}>
                    <div className={styles.notificationInfo}>
                      <strong>Marketing Emails</strong>
                      <p>Promotional content and offers</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.marketingEmails}
                        onChange={(e) => handleNotificationUpdate('marketingEmails', e.target.checked)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.notificationItem}>
                    <div className={styles.notificationInfo}>
                      <strong>Weekly Digest</strong>
                      <p>Weekly summary of activity</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.weeklyDigest}
                        onChange={(e) => handleNotificationUpdate('weeklyDigest', e.target.checked)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Privacy Section */}
          {activeSection === 'privacy' && (
            <div className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Privacy Settings</h2>
              <p className={styles.sectionDescription}>
                Control your privacy and data sharing preferences.
              </p>
              
              <div className={styles.privacyGroups}>
                <div className={styles.privacyGroup}>
                  <h3 className={styles.groupTitle}>Profile Visibility</h3>
                  
                  <div className={styles.privacyItem}>
                    <div className={styles.privacyInfo}>
                      <strong>Profile Visibility</strong>
                      <p>Who can see your profile</p>
                    </div>
                    <select
                      value={privacySettings.profileVisibility}
                      onChange={(e) => handlePrivacyUpdate('profileVisibility', e.target.value)}
                      className={styles.privacySelect}
                    >
                      <option value="public">Public</option>
                      <option value="registered">Registered Users Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  
                  <div className={styles.privacyItem}>
                    <div className={styles.privacyInfo}>
                      <strong>Show Email Address</strong>
                      <p>Display email on your profile</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={privacySettings.showEmail}
                        onChange={(e) => handlePrivacyUpdate('showEmail', e.target.checked)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.privacyItem}>
                    <div className={styles.privacyInfo}>
                      <strong>Show Phone Number</strong>
                      <p>Display phone on your profile</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={privacySettings.showPhone}
                        onChange={(e) => handlePrivacyUpdate('showPhone', e.target.checked)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>
                
                <div className={styles.privacyGroup}>
                  <h3 className={styles.groupTitle}>Data & Search</h3>
                  
                  <div className={styles.privacyItem}>
                    <div className={styles.privacyInfo}>
                      <strong>Search Engine Indexing</strong>
                      <p>Allow search engines to index your profile</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={privacySettings.allowSearchEngines}
                        onChange={(e) => handlePrivacyUpdate('allowSearchEngines', e.target.checked)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.privacyItem}>
                    <div className={styles.privacyInfo}>
                      <strong>Data Collection</strong>
                      <p>Allow analytics and usage data collection</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={privacySettings.dataCollection}
                        onChange={(e) => handlePrivacyUpdate('dataCollection', e.target.checked)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Login Sessions Section */}
          {activeSection === 'sessions' && (
            <div className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Active Login Sessions</h2>
              <p className={styles.sectionDescription}>
                Manage your active login sessions across different devices.
              </p>
              
              <div className={styles.sessionsContainer}>
                <div className={styles.sessionItem}>
                  <div className={styles.sessionInfo}>
                    <div className={styles.sessionHeader}>
                      <Monitor size={20} />
                      <div>
                        <strong>Current Session</strong>
                        <p>This device - Chrome on Windows</p>
                      </div>
                    </div>
                    <div className={styles.sessionDetails}>
                      <small>Last active: Just now</small>
                      <small>IP: 192.168.1.1</small>
                    </div>
                  </div>
                  <span className={styles.currentSession}>Current</span>
                </div>
              </div>
              
              <button className={styles.revokeAllButton}>
                <LogOut size={16} />
                Sign Out of All Other Sessions
              </button>
            </div>
          )}
          
          {/* Danger Zone Section */}
          {activeSection === 'danger' && (
            <div className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Danger Zone</h2>
              <p className={styles.sectionDescription}>
                Irreversible and destructive actions.
              </p>
              
              <div className={styles.dangerZone}>
                <div className={styles.dangerCard}>
                  <div className={styles.dangerInfo}>
                    <h3 className={styles.dangerTitle}>
                      <AlertTriangle size={20} />
                      Delete Account
                    </h3>
                    <p>
                      Permanently delete your account and all associated data. 
                      This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={saving}
                    className={styles.deleteButton}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className={styles.spinner} />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Delete Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;