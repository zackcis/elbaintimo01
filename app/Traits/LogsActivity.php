<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

trait LogsActivity
{
    /**
     * Log an activity
     */
    protected function logActivity(
        string $action,
        string $entityType,
        ?int $entityId = null,
        ?string $description = null
    ): void {
        ActivityLog::create([
            'user_name' => Auth::user()?->name ?? 'System',
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'description' => $description,
        ]);
    }
}
