import { forwardRef, type SVGAttributes } from 'react';

/**
 * HARIMI monogram (geometric “H”) — replaces the Laravel starter-kit mark.
 * Uses fill="currentColor" so parent `text-*` / `fill-current` classes control color.
 */
const AppLogoIcon = forwardRef<SVGSVGElement, SVGAttributes<SVGSVGElement>>(
    function AppLogoIcon({ className, ...props }, ref) {
        return (
            <svg
                ref={ref}
                viewBox="0 0 40 40"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
                className={className}
                {...props}
            >
                <path d="M8 32V8h4v9h16V8h4v24h-4v-9H12v9H8z" />
            </svg>
        );
    },
);

export default AppLogoIcon;
