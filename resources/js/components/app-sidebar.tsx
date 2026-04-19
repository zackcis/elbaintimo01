/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as products } from '@/routes/products';
import { index as clients } from '@/routes/clients';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { LayoutGrid, Package, Users, FolderTree, Building2, FileText, Settings } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Categories',
        href: '/categories',
        icon: FolderTree,
    },
    {
        title: 'Products',
        href: products(),
        icon: Package,
    },
    {
        title: 'Brands',
        href: '/brands',
        icon: Building2,
    },
    {
        title: 'Commandes',
        href: '/commands',
        icon: FileText,
    },
    {
        title: 'Clients',
        href: clients(),
        icon: Users,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Settings',
        href: '/settings/profile',
        icon: Settings,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset" className="[--sidebar-width:16rem]">
            <SidebarHeader className="px-4 py-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild tooltip="HARIMI">
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-3 py-2">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="px-3 py-3">
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
