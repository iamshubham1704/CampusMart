"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Head from 'next/head';
import { 
  ArrowLeft, MapPin, Calendar, Eye, Star, 
  Heart, Share2, Copy, Check, Loader2 
} from 'lucide-react';
import { listingsAPI } from '../../utils/api';
import styles from './SharedListing.module.css';

const SharedListing = () => {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (params.id) {
      // Basic validation of the ID parameter
      if (params.id.length !== 24 || !/^[a-f0-9]+$/i.test(params.id)) {
        setError('Invalid product ID format');
        setLoading(false);
        return;
      }
      fetchListing(params.id);
      
      // Track shared listing view for analytics (non-personal data)
      try {
        fetch('/api/analytics/shared-listing-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            listingId: params.id,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            referrer: document.referrer
          })
        }).catch(() => {
          // Silently fail if analytics tracking fails
        });
      } catch (error) {
        // Silently fail if analytics tracking fails
      }
    }
  }, [params.id]);

  const fetchListing = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the public API endpoint that doesn't require authentication
      const response = await fetch(`/api/listings/public/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setListing(data.listing);
      } else {
        setError(data.message || 'Failed to fetch listing');
      }
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      
      // Check if Web Share API is available (mobile devices)
      if (navigator.share && navigator.canShare) {
        try {
          await navigator.share({
            title: listing?.title || 'Check out this product on CampusMart',
            text: listing?.description?.substring(0, 100) || 'Amazing product on CampusMart',
            url: shareUrl
          });
          return;
        } catch (shareError) {
          console.log('Web Share API failed, falling back to clipboard');
        }
      }
      
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      const shareUrl = window.location.href;
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const nextImage = () => {
    if (listing.images && listing.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === listing.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (listing.images && listing.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? listing.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={48} className={styles.spinner} />
        <p>Loading product...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <h1>Product Not Found</h1>
          <p>{error || 'The product you are looking for does not exist or has been removed.'}</p>
          <button 
            onClick={() => router.push('/')} 
            className={styles.backButton}
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>{listing.title} - CampusMart</title>
        <meta name="description" content={listing.description?.substring(0, 160) || `Check out ${listing.title} on CampusMart`} />
        <meta property="og:title" content={listing.title} />
        <meta property="og:description" content={listing.description?.substring(0, 160) || `Check out ${listing.title} on CampusMart`} />
        <meta property="og:image" content={listing.images?.[0]?.url || listing.image} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={listing.title} />
        <meta name="twitter:description" content={listing.description?.substring(0, 160) || `Check out ${listing.title} on CampusMart`} />
        <meta name="twitter:image" content={listing.images?.[0]?.url || listing.image} />
        
        {/* Security Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </Head>
      {/* Header */}
      <div className={styles.header}>
        <button 
          onClick={() => router.push('/')} 
          className={styles.backButton}
        >
          <ArrowLeft size={20} />
          Back to CampusMart
        </button>
        
        <div className={styles.headerActions}>
          <button 
            onClick={handleShare}
            className={styles.shareButton}
            title="Share this product"
          >
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>

      {/* Product Content */}
      <div className={styles.productContainer}>
        {/* Image Gallery */}
        <div className={styles.imageSection}>
          <div className={styles.mainImageContainer}>
            <img
              src={listing.images?.[currentImageIndex]?.url || listing.image || '/api/placeholder/600/400'}
              alt={listing.title}
              className={styles.mainImage}
            />
            
            {/* Image Navigation */}
            {listing.images && listing.images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className={`${styles.imageNavButton} ${styles.prevButton}`}
                  aria-label="Previous image"
                >
                  <ArrowLeft size={20} />
                </button>
                <button 
                  onClick={nextImage}
                  className={`${styles.imageNavButton} ${styles.nextButton}`}
                  aria-label="Next image"
                >
                  <ArrowLeft size={20} />
                </button>
                
                {/* Image Counter */}
                <div className={styles.imageCounter}>
                  {currentImageIndex + 1} / {listing.images.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {listing.images && listing.images.length > 1 && (
            <div className={styles.thumbnailGallery}>
              {listing.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`${styles.thumbnail} ${index === currentImageIndex ? styles.activeThumbnail : ''}`}
                >
                  <img
                    src={image.url || image}
                    alt={`${listing.title} - Image ${index + 1}`}
                    className={styles.thumbnailImage}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className={styles.productDetails}>
          <div className={styles.productHeader}>
            <h1 className={styles.productTitle}>{listing.title}</h1>
            <div className={styles.productPrice}>
              <span className={styles.currentPrice}>₹{listing.finalPrice?.toLocaleString()}</span>
              {listing.originalPrice && listing.originalPrice > listing.finalPrice && (
                <div className={styles.priceBreakdown}>
                  <span className={styles.originalPriceLabel}>Original Price:</span>
                  <span className={styles.originalPrice}>
                    ₹{listing.originalPrice?.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.productMeta}>
            <div className={styles.metaItem}>
              <MapPin size={16} />
              <span>{listing.location}</span>
            </div>
            <div className={styles.metaItem}>
              <Calendar size={16} />
              <span>Listed {new Date(listing.createdAt || listing.datePosted).toLocaleDateString()}</span>
            </div>
            <div className={styles.metaItem}>
              <Eye size={16} />
              <span>{listing.views || 0} views</span>
            </div>
          </div>

          {listing.condition && (
            <div className={styles.condition}>
              <span className={styles.conditionLabel}>Condition:</span>
              <span className={styles.conditionValue}>{listing.condition}</span>
            </div>
          )}

          {listing.category && (
            <div className={styles.category}>
              <span className={styles.categoryLabel}>Category:</span>
              <span className={styles.categoryValue}>{listing.category}</span>
            </div>
          )}

          {listing.description && (
            <div className={styles.description}>
              <h3>Description</h3>
              <p>{listing.description}</p>
            </div>
          )}

          {/* Call to Action */}
          <div className={styles.ctaSection}>
            <button 
              onClick={() => router.push('/buyer-registration')}
              className={styles.registerButton}
            >
              Join CampusMart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedListing;
