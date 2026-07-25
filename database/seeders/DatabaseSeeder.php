<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create test user
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => Hash::make('password'),
                'phone' => '+1234567890',
                'address' => '123 Test Street, Test City, TC 12345',
                'email_verified_at' => now(),
            ]
        );

        // Create additional test users
        User::factory(5)->create([
            'phone' => fake()->phoneNumber(),
            'address' => fake()->address(),
        ]);

        // Seed categories first (required for products)
        // Seed brands before products (required for products)
        $this->call([
            CategorySeeder::class,
            BrandSeeder::class,
            ProductSeeder::class,
            MerchandisingSeeder::class,
        ]);

        $this->command->info('Database seeded successfully!');
        $this->command->info('Test user: test@example.com / password');
    }
}
