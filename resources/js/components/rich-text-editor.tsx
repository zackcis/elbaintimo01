import Highlight from '@tiptap/extension-highlight';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Highlighter, Italic } from 'lucide-react';
import { useEffect } from 'react';

type RichTextEditorProps = {
    id?: string;
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    disabled?: boolean;
    'aria-invalid'?: boolean;
};

function normalizeEmpty(html: string): string {
    const text = html
        .replace(/<br\s*\/?>/gi, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .trim();
    return text === '' ? '' : html;
}

export function RichTextEditor({
    id,
    value,
    onChange,
    placeholder,
    disabled = false,
    'aria-invalid': ariaInvalid,
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                bulletList: false,
                orderedList: false,
                listItem: false,
                blockquote: false,
                codeBlock: false,
                code: false,
                horizontalRule: false,
                strike: false,
                dropcursor: false,
                gapcursor: false,
            }),
            Highlight.configure({
                multicolor: false,
            }),
        ],
        content: value || '',
        editable: !disabled,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                id: id ?? '',
                class:
                    'min-h-[7.5rem] px-3 py-2 text-sm outline-none focus:outline-none [&_p]:my-1 [&_mark]:rounded-sm [&_mark]:bg-amber-200 [&_mark]:px-0.5',
                'aria-invalid': ariaInvalid ? 'true' : 'false',
                'data-placeholder': placeholder ?? '',
            },
            // Strip pasted formatting beyond our allowlist — TipTap will keep only enabled marks.
            transformPastedHTML(html) {
                return html;
            },
        },
        onUpdate: ({ editor: current }) => {
            onChange(normalizeEmpty(current.getHTML()));
        },
    });

    useEffect(() => {
        if (!editor) return;
        const current = normalizeEmpty(editor.getHTML());
        const next = value || '';
        if (current === next) return;
        // Avoid cursor jumps when parent re-renders with the same logical content.
        if (normalizeEmpty(current) === normalizeEmpty(next) && !next) return;
        editor.commands.setContent(next, { emitUpdate: false });
    }, [editor, value]);

    useEffect(() => {
        if (!editor) return;
        editor.setEditable(!disabled);
    }, [editor, disabled]);

    if (!editor) {
        return (
            <div className="min-h-[9.5rem] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-muted-foreground">
                Loading editor…
            </div>
        );
    }

    const btn = (active: boolean) =>
        `inline-flex h-8 w-8 items-center justify-center rounded-sm border text-xs transition-colors ${
            active
                ? 'border-burgundy bg-burgundy text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-burgundy hover:text-burgundy'
        }`;

    return (
        <div
            className={`rounded-md border bg-white shadow-xs ${
                ariaInvalid
                    ? 'border-destructive focus-within:ring-destructive/30'
                    : 'border-gray-300 focus-within:border-burgundy focus-within:ring-burgundy/50'
            } focus-within:ring-[3px]`}
        >
            <div className="flex items-center gap-1 border-b border-gray-200 px-2 py-1.5">
                <button
                    type="button"
                    className={btn(editor.isActive('bold'))}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={disabled}
                    aria-label="Bold"
                    title="Bold"
                >
                    <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    className={btn(editor.isActive('italic'))}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={disabled}
                    aria-label="Italic"
                    title="Italic"
                >
                    <Italic className="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    className={btn(editor.isActive('highlight'))}
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    disabled={disabled}
                    aria-label="Highlight"
                    title="Highlight"
                >
                    <Highlighter className="h-3.5 w-3.5" />
                </button>
                <span className="ml-2 text-[11px] font-sans text-muted-foreground">
                    Bold · Italic · Highlight only
                </span>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}
