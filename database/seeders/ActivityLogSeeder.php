<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use Illuminate\Database\Seeder;

class ActivityLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $activities = [
            [
                'user_name' => 'Admin User',
                'action' => 'created',
                'entity_type' => 'Product',
                'entity_id' => 1,
                'description' => 'Produit "Lingerie Premium" créé',
                'created_at' => now()->subHours(2),
            ],
            [
                'user_name' => 'Manager User',
                'action' => 'updated',
                'entity_type' => 'Product',
                'entity_id' => 2,
                'description' => 'Produit "Soutien-gorge délicat" modifié',
                'created_at' => now()->subHours(5),
            ],
            [
                'user_name' => 'Admin User',
                'action' => 'status_updated',
                'entity_type' => 'Command',
                'entity_id' => 1,
                'description' => 'Statut de la commande CMD-2025-0001 changé de "En attente" à "Confirmée"',
                'created_at' => now()->subDays(1),
            ],
            [
                'user_name' => 'Staff User',
                'action' => 'created',
                'entity_type' => 'Category',
                'entity_id' => 1,
                'description' => 'Catégorie "Lingerie" créée',
                'created_at' => now()->subDays(2),
            ],
            [
                'user_name' => 'Manager User',
                'action' => 'updated',
                'entity_type' => 'Brand',
                'entity_id' => 1,
                'description' => 'Logo de la marque "HARIMI" mis à jour',
                'created_at' => now()->subDays(3),
            ],
            [
                'user_name' => 'Admin User',
                'action' => 'deleted',
                'entity_type' => 'Product',
                'entity_id' => null,
                'description' => 'Produit "Ancien modèle" supprimé',
                'created_at' => now()->subDays(4),
            ],
        ];

        foreach ($activities as $activity) {
            ActivityLog::create($activity);
        }
    }
}
