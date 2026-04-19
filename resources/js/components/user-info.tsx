import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();

    const getRoleBadge = (role?: string) => {
        if (!role) return null;
        
        const roleConfig = {
            admin: { label: 'Admin', className: 'bg-burgundy text-white border-0' },
            manager: { label: 'Manager', className: 'bg-blue-100 text-blue-700 border-blue-200' },
            staff: { label: 'Staff', className: 'bg-gray-100 text-gray-700 border-gray-200' },
        };

        const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.staff;

        return (
            <Badge className={`text-xs ${config.className}`}>
                {config.label}
            </Badge>
        );
    };

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{user.name}</span>
                    {getRoleBadge((user as any).role)}
                </div>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
