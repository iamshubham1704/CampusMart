// app/api/cart/route.js
import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongo';
import { verifyToken } from '../../../lib/auth';
import { ObjectId } from 'mongodb';
import { getThumbnailUrl } from '../../../lib/imagekit';

// GET - Fetch user's cart
export async function GET(request) {
  try {
    // Verify authentication
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('campusmart');
    
    // Find user's cart with populated listing details
    const cart = await db.collection('carts').findOne({ userId: user.userId });
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return NextResponse.json({
        success: true,
        cart: {
          userId: user.userId,
          items: [],
          totalItems: 0,
          totalPrice: 0
        }
      });
    }

    // Get listing details for cart items with seller information using aggregation
    const listingIds = cart.items.map(item => new ObjectId(item.listingId));
    
    console.log('🔍 Fetching listings for cart items:', listingIds.map(id => id.toString()));
    
    // First, let's check what the listings look like without aggregation
    const simpleListings = await db.collection('listings')
      .find({
        _id: { $in: listingIds },
        status: 'active'
      })
      .toArray();
    
    console.log('📋 Simple listings found:', simpleListings.length);
    simpleListings.forEach(listing => {
      console.log(`📦 Simple listing ${listing._id}:`, {
        title: listing.title,
        sellerId: listing.sellerId,
        sellerIdType: typeof listing.sellerId,
        hasImages: listing.images && listing.images.length > 0
      });
    });
    
    // Let's also check what sellers exist
    const allSellers = await db.collection('sellers').find({}).limit(5).toArray();
    console.log('👥 Sample sellers:', allSellers.map(s => ({ id: s._id, name: s.name, businessName: s.businessName })));
    
    // Try a simpler aggregation approach
    const listings = await db.collection('listings')
      .aggregate([
        {
          $match: {
            _id: { $in: listingIds },
            status: 'active'
          }
        },
        {
          $lookup: {
            from: 'sellers',
            localField: 'sellerId',
            foreignField: '_id',
            as: 'seller'
          }
        }
      ])
      .toArray();

    console.log('📋 Aggregated listings found:', listings.length);
    listings.forEach(listing => {
      console.log(`📦 Aggregated listing ${listing._id}:`, {
        title: listing.title,
        sellerId: listing.sellerId,
        sellerIdType: typeof listing.sellerId,
        seller: listing.seller,
        sellerCount: listing.seller ? listing.seller.length : 0
      });
    });

    // Combine cart items with listing details
    const cartWithDetails = await Promise.all(cart.items.map(async (cartItem) => {
      const listing = listings.find(l => l._id.toString() === cartItem.listingId);
      if (!listing) return null; // Skip items where listing is no longer available
      
      // Get seller information with fallback to direct query
      let sellerName = 'Anonymous Seller';
      let seller = listing.seller?.[0];
      
      if (seller) {
        sellerName = seller.name || seller.businessName || 'Anonymous Seller';
        console.log(`👤 Seller found via lookup for ${listing.title}: ${sellerName}`);
      } else if (listing.sellerId) {
        // Fallback: try to get seller directly
        try {
          const sellerId = typeof listing.sellerId === 'string' ? new ObjectId(listing.sellerId) : listing.sellerId;
          const directSeller = await db.collection('sellers').findOne({ _id: sellerId });
          if (directSeller) {
            sellerName = directSeller.name || directSeller.businessName || 'Anonymous Seller';
            console.log(`👤 Seller found via direct query for ${listing.title}: ${sellerName}`);
          } else {
            console.log(`⚠️ No seller found via direct query for ${listing.title}, sellerId: ${listing.sellerId}`);
          }
        } catch (sellerError) {
          console.error(`❌ Error fetching seller directly for ${listing.title}:`, sellerError);
        }
      } else {
        console.log(`⚠️ No sellerId found for ${listing.title}`);
      }
      
      // Process images to ensure proper format
      let imageUrl = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop';
      if (listing.images && listing.images.length > 0) {
        const firstImage = listing.images[0];
        if (typeof firstImage === 'string') {
          // Old format - base64 string
          imageUrl = firstImage;
        } else if (typeof firstImage === 'object' && firstImage.url) {
          // New format - ImageKit object
          imageUrl = firstImage.url;
        }
        console.log(`🖼️ Image for ${listing.title}: ${imageUrl.substring(0, 50)}...`);
      } else {
        console.log(`⚠️ No images found for ${listing.title}`);
      }
      
      return {
        id: cartItem._id || cartItem.listingId,
        listingId: listing._id.toString(),
        title: listing.title,
        price: Math.round(listing.price * 1.1),
        image: imageUrl,
        seller: sellerName,
        condition: listing.condition,
        quantity: cartItem.quantity || 1,
        addedAt: cartItem.addedAt,
        subtotal: (Math.round(listing.price * 1.1) * (cartItem.quantity || 1))
      };
    }));

    const validCartItems = cartWithDetails.filter(Boolean);
    const totalItems = validCartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = validCartItems.reduce((sum, item) => sum + item.subtotal, 0);

    console.log(`✅ Cart processed successfully: ${totalItems} items, ₹${totalPrice}`);

    return NextResponse.json({
      success: true,
      cart: {
        userId: user.userId,
        items: validCartItems,
        totalItems,
        totalPrice: parseFloat(totalPrice.toFixed(2))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching cart:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch cart', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Add item to cart
export async function POST(request) {
  try {
    // Verify authentication
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { listingId, quantity = 1 } = await request.json();

    if (!listingId) {
      return NextResponse.json(
        { success: false, message: 'Listing ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    // Verify listing exists and is active
    const listing = await db.collection('listings').findOne({
      _id: new ObjectId(listingId),
      status: 'active'
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, message: 'Listing not found or no longer available' },
        { status: 404 }
      );
    }

    // Check if user is trying to add their own listing
    if (listing.sellerId && listing.sellerId.toString() === user.userId) {
      return NextResponse.json(
        { success: false, message: 'Cannot add your own listing to cart' },
        { status: 400 }
      );
    }

    // Check if cart exists, create if not
    let cart = await db.collection('carts').findOne({ userId: user.userId });
    
    if (!cart) {
      cart = {
        userId: user.userId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.listingId === listingId
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      cart.items[existingItemIndex].quantity = (cart.items[existingItemIndex].quantity || 1) + quantity;
      cart.items[existingItemIndex].updatedAt = new Date();
    } else {
      // Add new item to cart
      cart.items.push({
        listingId: listingId,
        quantity: quantity,
        addedAt: new Date()
      });
    }

    cart.updatedAt = new Date();

    // Upsert cart
    await db.collection('carts').replaceOne(
      { userId: user.userId },
      cart,
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Item added to cart successfully',
      cartItemsCount: cart.items.length
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to add item to cart', error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update cart item quantity
export async function PUT(request) {
  try {
    // Verify authentication
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { listingId, quantity } = await request.json();

    if (!listingId || quantity < 0) {
      return NextResponse.json(
        { success: false, message: 'Valid listing ID and quantity required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('campusmart');

    const cart = await db.collection('carts').findOne({ userId: user.userId });
    
    if (!cart) {
      return NextResponse.json(
        { success: false, message: 'Cart not found' },
        { status: 404 }
      );
    }

    // Find and update the item
    const itemIndex = cart.items.findIndex(item => item.listingId === listingId);
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Item not found in cart' },
        { status: 404 }
      );
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].updatedAt = new Date();
    }

    cart.updatedAt = new Date();

    await db.collection('carts').replaceOne(
      { userId: user.userId },
      cart
    );

    return NextResponse.json({
      success: true,
      message: quantity === 0 ? 'Item removed from cart' : 'Cart updated successfully'
    });

  } catch (error) {
 
    return NextResponse.json(
      { success: false, message: 'Failed to update cart', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from cart or clear entire cart
export async function DELETE(request) {
  try {
    // Verify authentication
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const listingId = url.searchParams.get('listingId');
    const clearAll = url.searchParams.get('clearAll') === 'true';

    const client = await clientPromise;
    const db = client.db('campusmart');

    if (clearAll) {
      // Clear entire cart
      await db.collection('carts').deleteOne({ userId: user.userId });
      
      return NextResponse.json({
        success: true,
        message: 'Cart cleared successfully'
      });
    }

    if (!listingId) {
      return NextResponse.json(
        { success: false, message: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Remove specific item
    const result = await db.collection('carts').updateOne(
      { userId: user.userId },
      { 
        $pull: { items: { listingId: listingId } },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Item not found in cart' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to remove item from cart', error: error.message },
      { status: 500 }
    );
  }
}