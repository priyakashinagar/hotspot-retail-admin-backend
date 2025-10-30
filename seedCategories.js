const mongoose = require('mongoose');
const Category = require('./src/moduls/product/category.model');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Sample category data
const sampleCategories = [
    {
        name: 'Electronics',
        description: 'Electronic items and gadgets',
        status: 'Active',
        sortOrder: 1
    },
    {
        name: 'Clothing',
        description: 'Fashion and apparel',
        status: 'Active',
        sortOrder: 2
    },
    {
        name: 'Home & Garden',
        description: 'Home improvement and garden supplies',
        status: 'Active',
        sortOrder: 3
    },
    {
        name: 'Sports & Outdoors',
        description: 'Sports equipment and outdoor gear',
        status: 'Active',
        sortOrder: 4
    },
    {
        name: 'Books',
        description: 'Books and educational materials',
        status: 'Active',
        sortOrder: 5
    }
];

const seedCategories = async () => {
    try {
        await connectDB();
        
        // Clear existing categories
        console.log('Clearing existing categories...');
        await Category.deleteMany({});
        
        // Insert sample categories
        console.log('Inserting sample categories...');
        const createdCategories = await Category.insertMany(sampleCategories);
        
        console.log(`Successfully created ${createdCategories.length} categories:`);
        createdCategories.forEach(cat => {
            console.log(`- ${cat.name} (${cat.slug})`);
        });
        
        // Create some sub-categories
        const electronicsCategory = createdCategories.find(cat => cat.name === 'Electronics');
        const clothingCategory = createdCategories.find(cat => cat.name === 'Clothing');
        
        const subCategories = [
            {
                name: 'Smartphones',
                description: 'Mobile phones and accessories',
                parentCategory: electronicsCategory._id,
                status: 'Active',
                sortOrder: 1
            },
            {
                name: 'Laptops',
                description: 'Portable computers and accessories',
                parentCategory: electronicsCategory._id,
                status: 'Active',
                sortOrder: 2
            },
            {
                name: 'Men\'s Clothing',
                description: 'Fashion for men',
                parentCategory: clothingCategory._id,
                status: 'Active',
                sortOrder: 1
            },
            {
                name: 'Women\'s Clothing',
                description: 'Fashion for women',
                parentCategory: clothingCategory._id,
                status: 'Active',
                sortOrder: 2
            }
        ];
        
        console.log('Creating sub-categories...');
        const createdSubCategories = await Category.insertMany(subCategories);
        
        console.log(`Successfully created ${createdSubCategories.length} sub-categories:`);
        createdSubCategories.forEach(cat => {
            console.log(`- ${cat.name} (Level ${cat.level})`);
        });
        
        console.log('\nCategory seeding completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
};

// Run the seeder
if (require.main === module) {
    seedCategories();
}

module.exports = { seedCategories };