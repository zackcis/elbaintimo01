/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductCardSkeleton() {
    return (
        <Card className="overflow-hidden border-gray-200 rounded-lg">
            <Skeleton className="aspect-[3/4] w-full" />
            <CardHeader className="bg-white">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="bg-white space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 w-20" />
                </div>
            </CardContent>
        </Card>
    );
}

export function ProductListSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function DashboardStatsSkeleton() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-border/80 rounded-2xl">
                    <CardHeader className="bg-white">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-10 rounded-lg" />
                        </div>
                    </CardHeader>
                    <CardContent className="bg-white">
                        <Skeleton className="h-8 w-20 mb-2" />
                        <Skeleton className="h-3 w-32" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function CategoryCardSkeleton() {
    return (
        <Card className="border-border/80 rounded-2xl">
            <div className="grid md:grid-cols-4 gap-0">
                <Skeleton className="md:col-span-1 aspect-[4/3] md:aspect-auto" />
                <div className="md:col-span-3 p-6 bg-white">
                    <Skeleton className="h-7 w-1/2 mb-4" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <div className="flex gap-2 mb-4">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="flex gap-2 pt-4 border-t">
                        <Skeleton className="h-8 flex-1" />
                        <Skeleton className="h-8 w-20" />
                    </div>
                </div>
            </div>
        </Card>
    );
}

export function CategoryListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-6">
            {Array.from({ length: count }).map((_, i) => (
                <CategoryCardSkeleton key={i} />
            ))}
        </div>
    );
}

