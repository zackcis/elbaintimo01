<?php

namespace App\Http\Controllers;

use App\Models\SiteMedia;
use App\Traits\HandlesImageUploads;
use App\Traits\LogsActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SiteMediaController extends Controller
{
    use HandlesImageUploads, LogsActivity;

    public function index(): Response
    {
        $rows = SiteMedia::query()->get();
        $media = [];

        foreach (SiteMedia::audiences() as $audience) {
            $media[$audience] = [];
            foreach (SiteMedia::keys() as $key) {
                $row = $rows->first(
                    fn (SiteMedia $m) => $m->key === $key && $m->audience === $audience
                );
                $media[$audience][$key] = [
                    'path' => $row?->path,
                    'url' => $row?->path ? $this->getImageUrl($row->path) : null,
                ];
            }
        }

        return Inertia::render('site-media/index', [
            'media' => $media,
            'audiences' => SiteMedia::audiences(),
            'keys' => SiteMedia::keys(),
            'storefrontUrl' => rtrim(
                (string) (config('harimi.storefront_origins')[0] ?? 'http://localhost:3000'),
                '/'
            ),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'audience' => ['required', 'in:women,men,kids'],
            'key' => ['required', 'in:'.implode(',', SiteMedia::keys())],
            'file' => ['nullable', 'file', 'max:51200'],
            'clear' => ['nullable', 'boolean'],
        ]);

        $audience = $validated['audience'];
        $key = $validated['key'];
        $clear = (bool) ($validated['clear'] ?? false);

        $row = SiteMedia::query()->firstOrNew([
            'key' => $key,
            'audience' => $audience,
        ]);

        if ($clear) {
            if ($row->path) {
                $this->deleteImage($row->path);
            }
            $row->path = null;
            $row->save();

            $this->logActivity('updated', 'SiteMedia', $row->id, "Cleared {$key} ({$audience})");

            return redirect()->route('site-media.index')
                ->with('success', 'Media rimosso. Sul sito tornerà il fallback locale o il gradient.');
        }

        /** @var UploadedFile|null $file */
        $file = $request->file('file');
        if ($file === null || ! $file->isValid()) {
            return back()->withErrors([
                'file' => 'Scegli un file valido prima di caricare.',
            ]);
        }

        $this->assertAllowedUpload($key, $file);

        if ($row->path) {
            $this->deleteImage($row->path);
        }

        $directory = 'site/'.$audience;
        $row->path = $this->storeSiteFile($file, $directory, $key);
        $row->save();

        $this->logActivity('updated', 'SiteMedia', $row->id, "Updated {$key} ({$audience})");

        return redirect()->route('site-media.index')
            ->with('success', 'Caricato. Usa “Vedi welcome” o “Vedi home” per controllare sul sito.');
    }

    private function assertAllowedUpload(string $key, UploadedFile $file): void
    {
        $mime = (string) $file->getMimeType();
        $ext = strtolower((string) $file->getClientOriginalExtension());

        if (SiteMedia::isStillImageKey($key)) {
            $ok = str_starts_with($mime, 'image/')
                && in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'], true);
            if (! $ok) {
                abort(422, 'Still images must be jpeg, png, gif, or webp.');
            }

            return;
        }

        if ($key === 'home_video_mp4') {
            $ok = in_array($mime, ['video/mp4', 'application/mp4'], true) || $ext === 'mp4';
            if (! $ok) {
                abort(422, 'Upload an MP4 video.');
            }

            return;
        }

        if ($key === 'home_video_webm') {
            $ok = $mime === 'video/webm' || $ext === 'webm';
            if (! $ok) {
                abort(422, 'Upload a WebM video.');
            }
        }
    }

    private function storeSiteFile(UploadedFile $file, string $directory, string $key): string
    {
        $ext = $file->getClientOriginalExtension() ?: match ($key) {
            'home_video_mp4' => 'mp4',
            'home_video_webm' => 'webm',
            default => 'jpg',
        };
        $filename = $key.'-'.Str::uuid().'.'.$ext;

        return $file->storeAs($directory, $filename, 'public');
    }
}
