/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { useRef, useState } from 'react';

interface ImageUploadProps {
    value?: string | File | null;
    onChange: (file: File | null) => void;
    onRemove?: () => void;
    preview?: string | null;
    label?: string;
    accept?: string;
    maxSize?: number; // in MB
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    preview,
    label = 'Upload Image',
    accept = 'image/*',
    maxSize = 5,
}: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(preview || null);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
            setError(`File size must be less than ${maxSize}MB`);
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file');
            return;
        }

        setError(null);
        onChange(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemove = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setPreviewUrl(null);
        setError(null);
        onChange(null);
        if (onRemove) {
            onRemove();
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-sans font-semibold text-gray-700">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileSelect}
                    className="hidden"
                />
                {previewUrl ? (
                    <div className="relative group">
                        <div className="aspect-video w-full rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleClick}
                            className="absolute bottom-2 right-2 bg-burgundy hover:bg-burgundy-dark text-white rounded-sm px-3 py-1.5 text-xs font-sans uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            Change
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={handleClick}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-burgundy hover:bg-burgundy/5 transition-colors"
                    >
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-sans text-gray-600 mb-1">
                            Click to upload image
                        </p>
                        <p className="text-xs font-sans text-gray-500">
                            PNG, JPG, GIF, WEBP up to {maxSize}MB
                        </p>
                    </div>
                )}
            </div>
            {error && (
                <p className="text-sm text-red-600 font-sans">{error}</p>
            )}
        </div>
    );
}

interface MultipleImageUploadProps {
    images: Array<{
        id?: number;
        file?: File | null;
        path?: string;
        preview?: string;
        is_primary?: boolean;
        position?: number;
    }>;
    onChange: (images: Array<{
        id?: number;
        file?: File | null;
        path?: string;
        preview?: string;
        is_primary?: boolean;
        position?: number;
    }>) => void;
    maxImages?: number;
}

interface SingleImageUploadProps {
    value?: File | string | null;
    onChange: (file: File | null) => void;
    preview?: string | null;
    label?: string;
}

export function SingleImageUpload({
    value,
    onChange,
    preview,
    label = 'Upload Image',
}: SingleImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        preview || (typeof value === 'string' ? `/storage/${value}` : null)
    );

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        onChange(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemove = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setPreviewUrl(null);
        onChange(null);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-sans font-semibold text-gray-700">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                {previewUrl ? (
                    <div className="relative group">
                        <div className="aspect-video w-full rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleClick}
                            className="absolute bottom-2 right-2 bg-burgundy hover:bg-burgundy-dark text-white rounded-sm px-3 py-1.5 text-xs font-sans uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            Change
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={handleClick}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-burgundy hover:bg-burgundy/5 transition-colors"
                    >
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-sans text-gray-600 mb-1">
                            Click to upload image
                        </p>
                        <p className="text-xs font-sans text-gray-500">
                            PNG, JPG, GIF, WEBP up to 5MB
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export function MultipleImageUpload({
    images,
    onChange,
    maxImages = 10,
}: MultipleImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const hadPrimary = images.some((img) => img.is_primary);

        const newImages = files.slice(0, maxImages - images.length).map((file, fileIndex) => {
            const preview = URL.createObjectURL(file);
            return {
                file,
                preview,
                // Only the first file in this batch is primary when the list was empty
                // and nothing was primary yet (fixes multi-select: all files saw images.length === 0).
                is_primary: !hadPrimary && images.length === 0 && fileIndex === 0,
                position: images.length + fileIndex,
            };
        });

        const merged = [...images, ...newImages];
        merged.forEach((img, i) => {
            img.position = i;
        });

        const firstPrimary = merged.findIndex((img) => img.is_primary);
        if (firstPrimary === -1) {
            if (merged.length > 0) {
                merged[0].is_primary = true;
            }
        } else {
            merged.forEach((img, i) => {
                img.is_primary = i === firstPrimary;
            });
        }

        onChange(merged);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemove = (index: number) => {
        const updated = images.filter((_, i) => i !== index);
        // If we removed the primary image, make the first one primary
        if (updated.length > 0 && images[index].is_primary) {
            updated[0].is_primary = true;
        }
        // Reorder positions
        updated.forEach((img, i) => {
            img.position = i;
        });
        onChange(updated);
    };

    const handleSetPrimary = (index: number) => {
        const updated = images.map((img, i) => ({
            ...img,
            is_primary: i === index,
        }));
        onChange(updated);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-sans font-semibold text-gray-700">
                    Product Images ({images.length}/{maxImages})
                </label>
                {images.length < maxImages && (
                    <Button
                        type="button"
                        onClick={handleClick}
                        variant="outline"
                        size="sm"
                        className="font-sans uppercase tracking-wide border-burgundy text-burgundy hover:bg-burgundy hover:text-white"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Add Images
                    </Button>
                )}
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />

            {images.length === 0 ? (
                <div
                    onClick={handleClick}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-burgundy hover:bg-burgundy/5 transition-colors"
                >
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-sans text-gray-600 mb-1">
                        Click to upload images
                    </p>
                    <p className="text-xs font-sans text-gray-500">
                        PNG, JPG, GIF, WEBP up to 5MB each
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image, index) => {
                        const previewUrl = image.preview || (image.path ? `/storage/${image.path}` : null);
                        return (
                            <div
                                key={index}
                                className="relative group aspect-square border-2 rounded-xl overflow-hidden"
                            >
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt={`Image ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                        <ImageIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                )}
                                
                                {/* Primary Badge */}
                                {image.is_primary && (
                                    <div className="absolute top-2 left-2 bg-burgundy text-white text-xs px-2 py-1 rounded font-sans uppercase tracking-wide">
                                        Primary
                                    </div>
                                )}

                                {/* Actions Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleSetPrimary(index)}
                                        className={`px-3 py-1.5 text-xs rounded-sm font-sans uppercase tracking-wide ${
                                            image.is_primary
                                                ? 'bg-burgundy text-white'
                                                : 'bg-white text-burgundy hover:bg-burgundy hover:text-white'
                                        }`}
                                    >
                                        {image.is_primary ? 'Primary' : 'Set Primary'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(index)}
                                        className="bg-red-500 hover:bg-red-600 text-white rounded-sm px-3 py-1.5 text-xs font-sans uppercase tracking-wide"
                                    >
                                        <X className="h-3 w-3 inline mr-1" />
                                        Remove
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

