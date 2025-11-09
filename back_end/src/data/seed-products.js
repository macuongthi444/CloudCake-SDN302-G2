/**
 * Script để seed dữ liệu mẫu cho testing Cart functionality
 * Sử dụng: node src/data/seed-products.js
 */

const mongoose = require('mongoose');
const db = require('../models');
require('dotenv').config();

const sampleData = require('./sample-data.json');

async function seedDatabase() {
    try {
        // Connect to database
        await db.connectDB();
        console.log('✅ Connected to MongoDB');

        // Clear existing data (optional - comment out if you want to keep existing data)
        // await db.category.deleteMany({});
        // await db.shop.deleteMany({});
        // await db.product.deleteMany({});
        // await db.productVariant.deleteMany({});
        // console.log('🗑️  Cleared existing data');

        // Seed Categories
        console.log('\n📁 Seeding Categories...');
        const categories = [];
        for (const catData of sampleData.categories) {
            const category = await db.category.findOneAndUpdate(
                { name: catData.name },
                catData,
                { upsert: true, new: true }
            );
            categories.push(category);
            console.log(`  ✓ Created/Updated category: ${category.name}`);
        }

        // Seed Shops
        console.log('\n🏪 Seeding Shops...');
        const shops = [];
        for (const shopData of sampleData.shops) {
            // Note: ownerId should be set to an actual user ID from your database
            // For testing, you can use a dummy ObjectId or skip this field
            if (!shopData.ownerId) {
                // Get first user with SELLER role or create a test user
                const sellerRole = await db.role.findOne({ name: 'SELLER' });
                if (sellerRole) {
                    const sellerUser = await db.user.findOne({ roles: sellerRole._id });
                    if (sellerUser) {
                        shopData.ownerId = sellerUser._id;
                    }
                }
            }

            const shop = await db.shop.findOneAndUpdate(
                { name: shopData.name },
                shopData,
                { upsert: true, new: true }
            );
            shops.push(shop);
            console.log(`  ✓ Created/Updated shop: ${shop.name}`);
        }

        // Seed Products
        console.log('\n🍰 Seeding Products...');
        const products = [];
        for (let i = 0; i < sampleData.products.length; i++) {
            const productData = sampleData.products[i];
            
            // Assign category (cycling through categories)
            productData.categoryId = categories[i % categories.length]._id;
            
            // Assign shop (cycling through shops)
            productData.shopId = shops[i % shops.length]._id;

            const product = await db.product.findOneAndUpdate(
                { sku: productData.sku },
                productData,
                { upsert: true, new: true }
            );
            products.push(product);
            console.log(`  ✓ Created/Updated product: ${product.name} (${product.sku})`);
        }

        // Seed Product Variants
        console.log('\n🎨 Seeding Product Variants...');
        let variantIndex = 0;
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            
            // Count how many variants belong to this product
            // This is a simplified approach - in real scenario, you'd have a mapping
            const variantsForProduct = [];
            if (i === 0) {
                // First product (Bánh Sinh Nhật Chocolate) has 4 variants
                variantsForProduct.push(sampleData.productVariants[0]);
                variantsForProduct.push(sampleData.productVariants[1]);
                variantsForProduct.push(sampleData.productVariants[2]);
                variantsForProduct.push(sampleData.productVariants[3]);
            } else if (i === 1) {
                // Second product (Bánh Kem Dâu) has 2 variants
                variantsForProduct.push(sampleData.productVariants[4]);
                variantsForProduct.push(sampleData.productVariants[5]);
            } else if (i === 2) {
                // Third product (Tiramisu) has 1 variant
                variantsForProduct.push(sampleData.productVariants[6]);
            } else if (i === 3) {
                // Fourth product (Cupcake) has 1 variant
                variantsForProduct.push(sampleData.productVariants[7]);
            } else if (i === 4) {
                // Fifth product (Tart) has 1 variant
                variantsForProduct.push(sampleData.productVariants[8]);
            }

            for (const variantData of variantsForProduct) {
                variantData.productId = product._id;
                const variant = await db.productVariant.findOneAndUpdate(
                    { sku: variantData.sku },
                    variantData,
                    { upsert: true, new: true }
                );
                console.log(`  ✓ Created/Updated variant: ${variant.name} (${variant.sku})`);
                variantIndex++;
            }
        }

        console.log('\n✨ Seeding completed successfully!');
        console.log(`📊 Summary:`);
        console.log(`   - Categories: ${categories.length}`);
        console.log(`   - Shops: ${shops.length}`);
        console.log(`   - Products: ${products.length}`);
        console.log(`   - Variants: ${variantIndex}`);

        // Print sample data for testing Cart
        console.log('\n🧪 Sample Data for Testing Cart:');
        console.log('─────────────────────────────────────');
        if (products.length > 0 && shops.length > 0) {
            const sampleProduct = products[0];
            const sampleShop = shops[0];
            const sampleVariants = await db.productVariant.find({ productId: sampleProduct._id });
            
            if (sampleVariants.length > 0) {
                const sampleVariant = sampleVariants[0];
                console.log('\n📦 Sample Product to add to Cart:');
                console.log(JSON.stringify({
                    userId: 'YOUR_USER_ID_HERE', // Replace with actual user ID
                    productId: sampleProduct._id.toString(),
                    variantId: sampleVariant._id.toString(),
                    productName: sampleProduct.name,
                    variantName: sampleVariant.name,
                    quantity: 1,
                    price: sampleVariant.discountedPrice || sampleVariant.price,
                    image: sampleVariant.image || (sampleProduct.images[0] && sampleProduct.images[0].url)
                }, null, 2));
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run seed function
seedDatabase();







