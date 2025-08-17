// scripts/migrateImagesToImageKit.js
// Run this script to migrate existing base64 images to ImageKit

import { MongoClient } from 'mongodb';
import { uploadMultipleImages } from '../lib/imagekit.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const BATCH_SIZE = 5; // Process 5 listings at a time

async function migrateImagesToImageKit() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🚀 Starting image migration to ImageKit...');
    
    await client.connect();
    const db = client.db('campusmart');
    const listings = db.collection('listings');

    // Find all listings with base64 images
    const listingsWithBase64 = await listings.find({
      images: { 
        $elemMatch: { 
          $regex: '^data:image/' 
        } 
      }
    }).toArray();

    console.log(`📊 Found ${listingsWithBase64.length} listings with base64 images`);

    if (listingsWithBase64.length === 0) {
      console.log('✅ No base64 images found. Migration not needed.');
      return;
    }

    let processed = 0;
    let migrated = 0;
    let failed = 0;

    // Process listings in batches
    for (let i = 0; i < listingsWithBase64.length; i += BATCH_SIZE) {
      const batch = listingsWithBase64.slice(i, i + BATCH_SIZE);
      
      console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(listingsWithBase64.length / BATCH_SIZE)}`);

      for (const listing of batch) {
        try {
          console.log(`  🔄 Processing listing: ${listing.title} (${listing._id})`);

          // Filter only base64 images
          const base64Images = listing.images.filter(img => 
            typeof img === 'string' && img.startsWith('data:image/')
          );

          if (base64Images.length === 0) {
            console.log(`  ⏭️  No base64 images in listing: ${listing.title}`);
            processed++;
            continue;
          }

          // Prepare images for upload
          const imagesToUpload = base64Images.map((base64Data, index) => ({
            base64Data,
            fileName: `migrated-${listing._id}-${index + 1}.jpg`
          }));

          // Upload to ImageKit
          const uploadResult = await uploadMultipleImages(
            imagesToUpload,
            `listings/${listing.sellerId}`
          );

          if (uploadResult.success && uploadResult.successful.length > 0) {
            // Prepare new image format
            const newImages = uploadResult.successful.map(result => ({
              url: result.data.url,
              thumbnailUrl: result.data.thumbnailUrl,
              fileId: result.data.fileId,
              fileName: result.data.fileName,
              width: result.data.width,
              height: result.data.height
            }));

            // Update listing with new image format
            await listings.updateOne(
              { _id: listing._id },
              { 
                $set: { 
                  images: newImages,
                  migratedToImageKit: true,
                  migratedAt: new Date(),
                  updatedAt: new Date()
                } 
              }
            );

            console.log(`  ✅ Successfully migrated ${newImages.length} images for: ${listing.title}`);
            migrated++;
          } else {
            console.error(`  ❌ Failed to upload images for: ${listing.title}`, uploadResult.error);
            failed++;
          }

          processed++;

        } catch (error) {
          console.error(`  ❌ Error processing listing ${listing._id}:`, error.message);
          failed++;
          processed++;
        }
      }

      // Add delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < listingsWithBase64.length) {
        console.log('  ⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log(`📊 Statistics:`);
    console.log(`  - Total listings processed: ${processed}`);
    console.log(`  - Successfully migrated: ${migrated}`);
    console.log(`  - Failed: ${failed}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('📦 Database connection closed');
  }
}

// Run migration
if (import.meta.url === `file://${process.argv[1]}`
    ) {
  migrateImagesToImageKit();
}

export default migrateImagesToImageKit;