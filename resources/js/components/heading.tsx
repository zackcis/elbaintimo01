export default function Heading({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <div className="mb-8 space-y-1">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
            {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
    );
}
