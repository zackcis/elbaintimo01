export type ResourceViewMode =
    | 'large-icons'
    | 'medium-icons'
    | 'small-icons'
    | 'list'
    | 'details';

export const RESOURCE_VIEW_MODES: ResourceViewMode[] = [
    'large-icons',
    'medium-icons',
    'small-icons',
    'list',
    'details',
];

export const RESOURCE_VIEW_LABELS: Record<ResourceViewMode, string> = {
    'large-icons': 'Large icons',
    'medium-icons': 'Medium icons',
    'small-icons': 'Small icons',
    list: 'List',
    details: 'Details',
};

export function isResourceViewMode(v: string): v is ResourceViewMode {
    return RESOURCE_VIEW_MODES.includes(v as ResourceViewMode);
}
