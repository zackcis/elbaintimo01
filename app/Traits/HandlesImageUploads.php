<?php

namespace App\Traits;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait HandlesImageUploads
{
    /**
     * Store an uploaded image and return the path
     */
    protected function storeImage(UploadedFile $file, string $directory = 'images'): string
    {
        // Generate unique filename
        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();

        // Store in public disk
        $path = $file->storeAs($directory, $filename, 'public');

        return $path;
    }

    /**
     * Delete an image from storage
     */
    protected function deleteImage(string $path): bool
    {
        if ($path && Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->delete($path);
        }

        return false;
    }

    /**
     * Get the public URL for an image
     */
    protected function getImageUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return Storage::disk('public')->url($path);
    }

    /**
     * Validate image file
     */
    protected function validateImage(UploadedFile $file): bool
    {
        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $maxSize = 5 * 1024 * 1024; // 5MB

        return in_array($file->getMimeType(), $allowedMimes)
            && $file->getSize() <= $maxSize;
    }
}
