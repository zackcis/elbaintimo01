/** Flatten a nested category tree (pre-order) for grid / list / table layouts. */
export function flattenCategoryTree<
    T extends { children?: T[] | undefined },
>(nodes: T[]): T[] {
    const out: T[] = [];
    const walk = (arr: T[]) => {
        for (const c of arr) {
            out.push(c);
            if (c.children?.length) {
                walk(c.children);
            }
        }
    };
    walk(nodes);
    return out;
}
