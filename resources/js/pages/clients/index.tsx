/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as clients } from '@/routes/clients';
import { type BreadcrumbItem, type User } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Users, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ProductListSkeleton } from '@/components/skeleton-loaders';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Clients',
        href: clients().url,
    },
];

interface ClientsData {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface ClientsProps {
    clients: ClientsData;
}

export default function ClientsIndex({ clients }: ClientsProps) {
    const [isLoading, setIsLoading] = useState(true);

    // Demo loading delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 350);
        return () => clearTimeout(timer);
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients - HARIMI" />
            <div className="flex h-full flex-1 flex-col gap-8 p-6 bg-beige-light">
                <div className="flex flex-col gap-3">
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-burgundy">
                        Clients
                    </h1>
                    <p className="text-base text-gray-700 font-sans">
                        Manage your client database ({clients.total} clients)
                    </p>
                </div>

                {isLoading ? (
                    <ProductListSkeleton count={6} />
                ) : clients.data.length === 0 ? (
                    <Card className="border-border/80 shadow-sm rounded-lg">
                        <CardContent className="flex flex-col items-center justify-center py-16 bg-white">
                            <Users className="h-16 w-16 text-gray-300 mb-4" />
                            <p className="text-xl font-serif font-semibold mb-2 text-burgundy">
                                No clients found
                            </p>
                            <p className="text-sm text-gray-600 font-sans">
                                Clients will appear here once they register.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {clients.data.map((client) => (
                                <Card
                                    key={client.id}
                                    className="hover:shadow-lg transition-all duration-150 border-border/80 rounded-lg group"
                                >
                                    <CardHeader className="bg-white">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-full bg-burgundy/10 flex items-center justify-center border-2 border-burgundy/20 group-hover:border-burgundy transition-colors duration-150">
                                                <span className="text-burgundy font-serif font-bold text-lg">
                                                    {getInitials(client.name)}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg font-serif font-bold truncate text-burgundy group-hover:text-burgundy-dark transition-colors duration-150">
                                                    {client.name}
                                                </CardTitle>
                                                <p className="text-sm text-gray-500 font-sans uppercase tracking-wide mt-1">
                                                    ID: #{client.id}
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3 bg-white">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Mail className="h-4 w-4 text-burgundy flex-shrink-0" />
                                            <span className="truncate text-gray-700 font-sans">
                                                {client.email}
                                            </span>
                                        </div>
                                        {(client as User & { phone?: string })
                                            .phone && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <Phone className="h-4 w-4 text-burgundy flex-shrink-0" />
                                                <span className="text-gray-700 font-sans">
                                                    {(
                                                        client as User & {
                                                            phone?: string;
                                                        }
                                                    ).phone}
                                                </span>
                                            </div>
                                        )}
                                        {(client as User & { address?: string })
                                            .address && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <MapPin className="h-4 w-4 text-burgundy flex-shrink-0" />
                                                <span className="line-clamp-1 text-gray-700 font-sans">
                                                    {(
                                                        client as User & {
                                                            address?: string;
                                                        }
                                                    ).address}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 text-sm pt-3 border-t border-gray-100">
                                            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-600 font-sans text-xs uppercase tracking-wide">
                                                Joined{' '}
                                                {formatDate(client.created_at)}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {clients.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4">
                                {clients.links.map((link, index) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={index}
                                                className="px-4 py-2 text-sm text-gray-500 font-sans"
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        );
                                    }

                                    return (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            className={`px-4 py-2 text-sm rounded-sm border font-sans uppercase tracking-wide transition-all duration-150 ${
                                                link.active
                                                    ? 'bg-burgundy text-white border-burgundy'
                                                    : 'hover:bg-burgundy hover:text-white hover:border-burgundy border-gray-300 text-gray-700'
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
