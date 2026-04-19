# E-Commerce Catalog Testing Guide

## Overview

This guide provides instructions for testing the e-commerce catalog database schema with fake data.

## Database Schema

### Tables Created

1. **users** - User accounts with phone and address
2. **categories** - Self-referencing hierarchical categories
3. **products** - Product catalog items
4. **product_variants** - Product variations (size, color, price, stock)
5. **product_images** - Product images with primary flag and position
6. **category_images** - Category images

### Relationships

- **Categories**: Self-referencing (parent/child)
- **Products** → Categories (belongsTo)
- **ProductVariants** → Products (belongsTo)
- **ProductImages** → Products (belongsTo)
- **CategoryImages** → Categories (belongsTo)

## Running Migrations & Seeders

### Fresh Migration with Seed Data

```bash
php artisan migrate:fresh --seed
```

This will:
- Drop all existing tables
- Run all migrations
- Seed the database with test data

### Run Seeders Only (if migrations already exist)

```bash
php artisan db:seed
```

Or seed specific seeders:

```bash
php artisan db:seed --class=CategorySeeder
php artisan db:seed --class=ProductSeeder
```

## Test Data Created

### Users

- **Test User**: 
  - Email: `test@example.com`
  - Password: `password`
  - Phone: `+1234567890`
  - Address: `123 Test Street, Test City, TC 12345`

- **Additional Users**: 5 fake users generated with random data

### Categories (Hierarchical Structure)

**Parent Categories:**
- Women's Clothing
- Men's Clothing
- Accessories
- Shoes

**Child Categories:**

**Women's Clothing:**
- Dresses
- Tops
- Bottoms
- Outerwear

**Men's Clothing:**
- T-Shirts & Shirts
- Pants & Shorts
- Jackets & Coats

**Accessories:**
- Bags
- Jewelry
- Watches

**Shoes:**
- Women's Shoes
- Men's Shoes

### Products (10 Products Created)

1. **Elegant Evening Dress** (Women's → Dresses)
   - 5 variants (Black S/M/L, Red S/M)
   - 3 images

2. **Casual Summer Dress** (Women's → Dresses)
   - 6 variants (White XS/S/M/L, Blue M/L)
   - 4 images

3. **Silk Blouse** (Women's → Tops)
   - 5 variants (White S/M/L, Pink S/M)
   - 2 images

4. **Casual T-Shirt** (Women's → Tops)
   - 7 variants (Black XS/S/M/L/XL, White M/L)
   - 2 images

5. **High-Waisted Jeans** (Women's → Bottoms)
   - 6 variants (Blue 26/28/30/32, Black 28/30)
   - 3 images

6. **Classic Oxford Shirt** (Men's → T-Shirts & Shirts)
   - 6 variants (White S/M/L/XL, Blue M/L)
   - 2 images

7. **Cotton T-Shirt** (Men's → T-Shirts & Shirts)
   - 7 variants (Black S/M/L/XL/XXL, Gray M/L)
   - 2 images

8. **Classic Chinos** (Men's → Pants & Shorts)
   - 6 variants (Khaki 30/32/34/36, Navy 32/34)
   - 2 images

9. **Leather Handbag** (Accessories → Bags)
   - 3 variants (Black, Brown, Red - no size)
   - 3 images

10. **Backpack** (Accessories → Bags)
    - 3 variants (Black, Gray, Blue - no size)
    - 2 images

### Category Images

- All parent categories have images
- Selected child categories have images

## Testing Relationships

### Using Tinker

```bash
php artisan tinker
```

#### Test Category Relationships

```php
// Get a category with parent
$category = App\Models\Category::where('name', 'Dresses')->first();
$category->parent; // Women's Clothing
$category->parent->name; // "Women's Clothing"

// Get children of a category
$womens = App\Models\Category::where('name', "Women's Clothing")->first();
$womens->children; // Collection of child categories

// Get products in a category
$womens->products; // Collection of products

// Get category images
$womens->images; // Collection of category images
```

#### Test Product Relationships

```php
// Get a product with category
$product = App\Models\Product::first();
$product->category; // Category model
$product->category->name; // Category name

// Get product variants
$product->variants; // Collection of ProductVariant

// Get variants with specific attributes
$product->variants->where('color', 'Black');
$product->variants->where('size', 'M');

// Get product images
$product->images; // Collection of ProductImage

// Get primary image
$product->images->where('is_primary', true)->first();

// Get images ordered by position
$product->images->sortBy('position');
```

#### Test ProductVariant Relationships

```php
// Get variant with product
$variant = App\Models\ProductVariant::first();
$variant->product; // Product model
$variant->product->title; // Product title
```

#### Test User

```php
// Get test user
$user = App\Models\User::where('email', 'test@example.com')->first();
$user->phone; // "+1234567890"
$user->address; // "123 Test Street, Test City, TC 12345"
```

### Example Queries

#### Get all products with their categories, variants, and images

```php
$products = App\Models\Product::with(['category', 'variants', 'images'])->get();
```

#### Get products in a specific category with variants

```php
$category = App\Models\Category::where('name', 'Dresses')->first();
$products = $category->products()->with('variants')->get();
```

#### Get all parent categories with their children

```php
$parents = App\Models\Category::whereNull('parent_id')->with('children')->get();
```

#### Get product with primary image

```php
$product = App\Models\Product::with(['images' => function($query) {
    $query->where('is_primary', true);
}])->first();
```

#### Get available products (with stock > 0)

```php
$products = App\Models\Product::whereHas('variants', function($query) {
    $query->where('stock', '>', 0);
})->with('variants')->get();
```

## Database Statistics

After seeding, you should have approximately:

- **Users**: 6 (1 test user + 5 fake users)
- **Categories**: 15 (4 parent + 11 child)
- **Products**: 10
- **Product Variants**: ~50
- **Product Images**: ~25
- **Category Images**: ~8

## Testing Checklist

- [ ] Run migrations successfully
- [ ] Seed database with test data
- [ ] Verify user login with test credentials
- [ ] Test category hierarchy (parent/child relationships)
- [ ] Test product-to-category relationships
- [ ] Test product variants (size, color, price, stock)
- [ ] Test product images (multiple images, primary flag, position)
- [ ] Test category images
- [ ] Verify cascade deletes (delete product → variants/images deleted)
- [ ] Verify cascade deletes (delete category → products deleted)
- [ ] Test querying products with relationships loaded

## Common Testing Scenarios

### Scenario 1: Display Product Catalog

```php
$categories = App\Models\Category::whereNull('parent_id')
    ->with(['children', 'images'])
    ->get();

foreach ($categories as $category) {
    echo $category->name . "\n";
    foreach ($category->children as $child) {
        $products = $child->products()->with('images')->get();
        // Display products
    }
}
```

### Scenario 2: Product Detail Page

```php
$product = App\Models\Product::with([
    'category',
    'variants' => function($query) {
        $query->where('stock', '>', 0)->orderBy('price');
    },
    'images' => function($query) {
        $query->orderBy('position');
    }
])->find($productId);
```

### Scenario 3: Filter Products by Variant

```php
// Get products with specific color
$products = App\Models\Product::whereHas('variants', function($query) {
    $query->where('color', 'Black');
})->with(['variants' => function($query) {
    $query->where('color', 'Black');
}])->get();
```

## Notes

- All passwords are set to `password` for testing
- Product images use placeholder paths (you'll need to add actual images)
- Category images use placeholder paths (you'll need to add actual images)
- Stock levels are randomly generated between 0-100
- Prices range from $24.99 to $199.99

## Troubleshooting

### Migration Errors

If you encounter migration errors:
```bash
php artisan migrate:fresh
```

### Seeder Errors

If seeders fail, check:
1. Migrations ran successfully
2. Foreign key relationships are correct
3. Database connection is working

### Data Not Appearing

Run tinker to check:
```bash
php artisan tinker
App\Models\Product::count()
App\Models\Category::count()
```







