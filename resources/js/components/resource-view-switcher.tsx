import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
    RESOURCE_VIEW_LABELS,
    RESOURCE_VIEW_MODES,
    type ResourceViewMode,
} from '@/lib/resource-view';
import { AlignJustify, Check, ChevronDown, Grid2x2, List, PanelTop, Square } from 'lucide-react';

const VIEW_ICONS: Record<ResourceViewMode, typeof PanelTop> = {
    'large-icons': PanelTop,
    'medium-icons': Square,
    'small-icons': Grid2x2,
    list: List,
    details: AlignJustify,
};

interface ResourceViewSwitcherProps {
    mode: ResourceViewMode;
    onChange: (mode: ResourceViewMode) => void;
    className?: string;
}

export function ResourceViewSwitcher({
    mode,
    onChange,
    className,
}: ResourceViewSwitcherProps) {
    const CurrentIcon = VIEW_ICONS[mode];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                        'h-9 min-w-[10.5rem] justify-between gap-2 border-border bg-white font-sans text-xs font-medium shadow-sm',
                        className,
                    )}
                >
                    <span className="flex items-center gap-2 truncate">
                        <CurrentIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="truncate">{RESOURCE_VIEW_LABELS[mode]}</span>
                    </span>
                    <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 font-sans">
                {RESOURCE_VIEW_MODES.map((m) => {
                    const Icon = VIEW_ICONS[m];
                    const active = m === mode;
                    return (
                        <DropdownMenuItem
                            key={m}
                            onClick={() => onChange(m)}
                            className={cn(
                                'flex cursor-pointer items-center gap-2.5 py-2 text-sm',
                                active && 'bg-accent/80',
                            )}
                        >
                            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                            <span className="flex-1">{RESOURCE_VIEW_LABELS[m]}</span>
                            {active ? (
                                <Check className="size-4 shrink-0 text-foreground" aria-hidden />
                            ) : (
                                <span className="size-4 shrink-0" aria-hidden />
                            )}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
