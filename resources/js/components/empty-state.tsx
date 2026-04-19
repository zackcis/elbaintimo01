import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Icon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title}
            </h3>
            <p className="text-sm text-gray-600 text-center max-w-md mb-6">
                {description}
            </p>
            {actionLabel && (actionHref || onAction) && (
                <>
                    {actionHref ? (
                        <Link href={actionHref}>
                            <Button className="bg-burgundy text-white hover:bg-burgundy-dark">
                                {actionLabel}
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            onClick={onAction}
                            className="bg-burgundy text-white hover:bg-burgundy-dark"
                        >
                            {actionLabel}
                        </Button>
                    )}
                </>
            )}
        </div>
    );
}

