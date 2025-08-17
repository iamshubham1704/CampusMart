'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Shield,
  Eye,
  Users,
  Lock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Mail,
  Phone
} from 'lucide-react';

const PolicyPage = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="policy-page">
      {/* Header */}
      <header className="policy-header">
        <div className="container">
          <button 
            className="back-btn"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="policy-title">Privacy Policy & Terms</h1>
          <p className="policy-subtitle">Last updated: January 2025</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="policy-main">
        <div className="container">
          <div className="policy-content">
            
            {/* Privacy Policy Section */}
            <section className="policy-section">
              <div className="section-header">
                <div className="section-icon">
                  <Shield size={28} />
                </div>
                <div className="section-info">
                  <h2>Privacy Policy</h2>
                  <p>How we collect, use, and protect your information</p>
                </div>
              </div>

              <div className="policy-card">
                <h3>Information We Collect</h3>
                <ul>
                  <li><strong>Account Information:</strong> Name, email address, college/university details</li>
                  <li><strong>Profile Data:</strong> Profile picture, contact preferences, verification status</li>
                  <li><strong>Transaction Data:</strong> Purchase history, communication logs</li>
                  <li><strong>Technical Data:</strong> IP address, browser type, device information, usage analytics</li>
                </ul>
              </div>

              <div className="policy-card">
                <h3>How We Use Your Information</h3>
                <ul>
                  <li>Facilitate secure transactions between students</li>
                  <li>Verify college/university affiliation</li>
                  <li>Provide customer support and resolve disputes</li>
                  <li>Improve our platform and user experience</li>
                  <li>Send important updates and notifications</li>
                  <li>Detect and prevent fraudulent activities</li>
                </ul>
              </div>

              <div className="policy-card">
                <h3>Information Sharing</h3>
                <div className="sharing-info">
                  <div className="sharing-item">
                    <CheckCircle className="sharing-icon allowed" size={20} />
                    <div>
                      <strong>With Other Students:</strong> Only your name, profile picture, and college are visible to other verified students for transactions.
                    </div>
                  </div>
                  <div className="sharing-item">
                    <CheckCircle className="sharing-icon allowed" size={20} />
                    <div>
                      <strong>For Verification:</strong> College email domains are checked to verify student status.
                    </div>
                  </div>
                  <div className="sharing-item">
                    <AlertTriangle className="sharing-icon restricted" size={20} />
                    <div>
                      <strong>Never Shared:</strong> Your personal contact information, transaction details, or private messages are never shared with third parties.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Terms of Service Section */}
            <section className="policy-section">
              <div className="section-header">
                <div className="section-icon">
                  <FileText size={28} />
                </div>
                <div className="section-info">
                  <h2>Terms of Service</h2>
                  <p>Rules and guidelines for using CampusMart</p>
                </div>
              </div>

              <div className="policy-card">
                <h3>Eligibility</h3>
                <ul>
                  <li>Must be a currently enrolled student at a recognized college/university</li>
                  <li>Must provide valid college email address for verification</li>
                  
                  <li>Must agree to conduct transactions safely and responsibly</li>
                </ul>
              </div>

              <div className="policy-card">
                <h3>Prohibited Items & Activities</h3>
                <div className="prohibited-grid">
                  <div className="prohibited-item">
                    <AlertTriangle size={20} />
                    <span>Illegal substances or items</span>
                  </div>
                  <div className="prohibited-item">
                    <AlertTriangle size={20} />
                    <span>Weapons or dangerous items</span>
                  </div>
                  <div className="prohibited-item">
                    <AlertTriangle size={20} />
                    <span>Counterfeit or pirated goods</span>
                  </div>
                  <div className="prohibited-item">
                    <AlertTriangle size={20} />
                    <span>Academic dishonesty materials</span>
                  </div>
                  <div className="prohibited-item">
                    <AlertTriangle size={20} />
                    <span>Harassment or abusive behavior</span>
                  </div>
                  <div className="prohibited-item">
                    <AlertTriangle size={20} />
                    <span>Spam or fraudulent listings</span>
                  </div>
                </div>
              </div>

              <div className="policy-card">
                <h3>Safety Guidelines</h3>
                <ul>
                  <li>Meet in public, well-lit areas on campus</li>
                  <li>Inspect items thoroughly before purchasing</li>
                  <li>Use secure payment methods when possible</li>
                  <li>Report suspicious activities immediately</li>
                  <li>Keep transaction records for your protection</li>
                </ul>
              </div>
            </section>

            
            {/* Contact Section */}
            <section className="policy-section">
              <div className="section-header">
                <div className="section-icon">
                  <Users size={28} />
                </div>
                <div className="section-info">
                  <h2>Contact Us</h2>
                  <p>Questions about our policies?</p>
                </div>
              </div>

              <div className="contact-grid">
                <div className="contact-card">
                  <Mail size={24} />
                  <h4>Email Support</h4>
                  <p>privacy@campusmart.com</p>
                  <span>Response within 24 hours</span>
                </div>

                <div className="contact-card">
                  <Phone size={24} />
                  <h4>Phone Support</h4>
                  <p>+91-XXXX-XXXXXX</p>
                  <span>Mon-Fri, 9AM-6PM</span>
                </div>

                <div className="contact-card">
                  <Shield size={24} />
                  <h4>Report Issues</h4>
                  <p>Use our report feature</p>
                  <span>Available 24/7</span>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="policy-footer">
              <div className="footer-content">
                <p>
                  By using CampusMart, you agree to our Terms of Service and Privacy Policy. 
                  These terms are subject to change with notice.
                </p>
                <div className="footer-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => router.push('/')}
                  >
                    Return to Homepage
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PolicyPage;