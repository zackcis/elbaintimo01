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
import { useUi } from '@/hooks/use-ui';
import { dashboard } from '@/routes';
import { index as brandsIndex } from '@/routes/brands';
import { index as categoriesIndex } from '@/routes/categories';
import { index as clients } from '@/routes/clients';
import { index as commandsIndex } from '@/routes/commands';
import { index as products } from '@/routes/products';
import { edit as profileEdit } from '@/routes/profile';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { LayoutGrid, Package, Users, FolderTree, Building2, FileText, Settings } from 'lucide-react';
import { useMemo } from 'react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { t } = useUi();

    const mainNavItems: NavItem[] = useMemo(
        () => [
            {
                title: t('nav.dashboard'),
                href: dashboard(),
                icon: LayoutGrid,
            },
            {
                title: t('nav.categories'),
                href: categoriesIndex(),
                icon: FolderTree,
            },
            {
                title: t('nav.products'),
                href: products(),
                icon: Package,
            },
            {
                title: t('nav.brands'),
                href: brandsIndex(),
                icon: Building2,
            },
            {
                title: t('nav.commands'),
                href: commandsIndex(),
                icon: FileText,
            },
            {
                title: t('nav.clients'),
                href: clients(),
                icon: Users,
            },
        ],
        [t],
    );

    const footerNavItems: NavItem[] = useMemo(
        () => [
            {
                title: t('nav.settings'),
                href: profileEdit(),
                icon: Settings,
            },
        ],
        [t],
    );

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
