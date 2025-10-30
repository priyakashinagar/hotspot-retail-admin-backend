# Category API Testing Guide

This document provides a comprehensive guide to test all category APIs.

## Prerequisites
1. Backend server running on http://localhost:5000
2. Valid authentication token
3. MongoDB database connected

## API Endpoints

### 1. Create Category
**POST** `/api/categories`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body (Form Data):**
```
name: "Test Category"
description: "Test category description"
parentCategory: "" (optional)
status: "Active"
sortOrder: 0
image: [file] (optional)
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "_id": "...",
    "name": "Test Category",
    "slug": "test-category",
    "description": "Test category description",
    "status": "Active",
    "level": 0,
    "path": "",
    "sortOrder": 0,
    "isDeleted": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 2. Get All Categories
**GET** `/api/categories`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (Active/Inactive)
- `parentCategory`: Filter by parent category ID (use 'null' for root categories)
- `search`: Search in name and description
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: Sort direction (asc/desc, default: desc)

**Example:** `/api/categories?page=1&limit=10&status=Active&search=test`

**Expected Response:**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {
    "categories": [...],
    "pagination": {
      "current": 1,
      "total": 1,
      "hasNext": false,
      "hasPrev": false,
      "totalItems": 0
    }
  }
}
```

### 3. Get Category by ID
**GET** `/api/categories/:id`

**Expected Response:**
```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": {
    "_id": "...",
    "name": "Test Category",
    "slug": "test-category",
    "description": "Test category description",
    "parentCategory": null,
    "status": "Active",
    "level": 0,
    "path": "",
    "sortOrder": 0,
    "children": [...]
  }
}
```

### 4. Update Category
**PUT** `/api/categories/:id`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body (Form Data):**
```
name: "Updated Category Name"
description: "Updated description"
status: "Inactive"
sortOrder: 1
image: [file] (optional)
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "_id": "...",
    "name": "Updated Category Name",
    "description": "Updated description",
    "status": "Inactive",
    "sortOrder": 1,
    "updatedAt": "..."
  }
}
```

### 5. Delete Category
**DELETE** `/api/categories/:id`

**Expected Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

### 6. Get Category Tree
**GET** `/api/categories/tree`

**Expected Response:**
```json
{
  "success": true,
  "message": "Category tree retrieved successfully",
  "data": [
    {
      "_id": "...",
      "name": "Parent Category",
      "children": [
        {
          "_id": "...",
          "name": "Child Category",
          "children": []
        }
      ]
    }
  ]
}
```

### 7. Get Parent Categories
**GET** `/api/categories/parents`

**Expected Response:**
```json
{
  "success": true,
  "message": "Parent categories retrieved successfully",
  "data": [
    {
      "_id": "...",
      "name": "Category Name",
      "slug": "category-name",
      "level": 0
    }
  ]
}
```

### 8. Bulk Update Status
**PATCH** `/api/categories/bulk-update`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "categoryIds": ["id1", "id2", "id3"],
  "status": "Active"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "3 categories updated successfully"
}
```

## Frontend Integration

The frontend uses the `categoryService.js` file which provides methods for all API operations:

```javascript
import categoryService from '../../services/categoryService'

// Get categories with filters
const response = await categoryService.getCategories({
  page: 1,
  limit: 10,
  search: 'test',
  status: 'Active'
})

// Create category
const response = await categoryService.createCategory({
  name: 'New Category',
  description: 'Description',
  status: 'Active'
})

// Update category
const response = await categoryService.updateCategory(categoryId, {
  name: 'Updated Name'
})

// Delete category
const response = await categoryService.deleteCategory(categoryId)

// Get parent categories for dropdown
const response = await categoryService.getParentCategories()

// Bulk update status
const response = await categoryService.bulkUpdateStatus(['id1', 'id2'], 'Active')
```

## Testing Checklist

### Backend Testing:
- [ ] Create category without image
- [ ] Create category with image
- [ ] Create category with parent category
- [ ] Get all categories without filters
- [ ] Get categories with search filter
- [ ] Get categories with status filter
- [ ] Get categories with parent category filter
- [ ] Get categories with pagination
- [ ] Get categories with sorting
- [ ] Get single category by ID
- [ ] Update category without image
- [ ] Update category with new image
- [ ] Update category parent
- [ ] Delete category without children
- [ ] Try to delete category with children (should fail)
- [ ] Get category tree
- [ ] Get parent categories
- [ ] Bulk update status

### Frontend Testing:
- [ ] Page loads without errors
- [ ] Create category modal opens
- [ ] Create category form validation
- [ ] Create category with image upload
- [ ] Parent category dropdown populated
- [ ] Categories list displays
- [ ] Search functionality works
- [ ] Status filter works
- [ ] Pagination works
- [ ] Sorting works
- [ ] Edit category modal opens
- [ ] Edit category saves changes
- [ ] Delete confirmation modal works
- [ ] Delete category works
- [ ] Bulk operations work
- [ ] Error handling displays properly
- [ ] Loading states work

## Common Issues and Solutions

### 1. CORS Issues
Make sure the backend CORS configuration includes the frontend URL:
```javascript
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
```

### 2. Authentication Issues
Ensure you have a valid JWT token in localStorage:
```javascript
localStorage.setItem('authToken', 'your-jwt-token')
```

### 3. File Upload Issues
Make sure the uploads/categories directory exists and has proper permissions.

### 4. Image Display Issues
Ensure the backend serves static files:
```javascript
app.use('/uploads', express.static('uploads'));
```

### 5. Environment Variables
Frontend `.env` file should have:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

Backend should have proper MongoDB connection string and other required variables.