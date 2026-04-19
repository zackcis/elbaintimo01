<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_name',
        'action',
        'entity_type',
        'entity_id',
        'description',
    ];

    /**
     * Get activity description
     */
    public function getDescriptionAttribute($value): string
    {
        if ($value) {
            return $value;
        }

        $entityName = $this->entity_type;
        $action = match ($this->action) {
            'created' => 'créé',
            'updated' => 'modifié',
            'deleted' => 'supprimé',
            'status_updated' => 'statut mis à jour',
            default => $this->action,
        };

        return "{$entityName} {$action}";
    }
}
