<?php

namespace App\Support;

/**
 * Allowlist HTML sanitizer for product descriptions (bold / italic / highlight only).
 */
final class SafeHtml
{
    /** @var list<string> */
    private const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'mark'];

    public static function productDescription(?string $html): ?string
    {
        if ($html === null) {
            return null;
        }

        $html = trim($html);
        if ($html === '') {
            return null;
        }

        // Legacy plain-text descriptions: keep as-is (no tags).
        if (! preg_match('/<[^>]+>/', $html)) {
            return $html;
        }

        $previous = libxml_use_internal_errors(true);

        try {
            $dom = new \DOMDocument('1.0', 'UTF-8');
            $wrapped = '<div id="harimi-safe-root">'.$html.'</div>';
            $dom->loadHTML(
                '<?xml encoding="UTF-8">'.$wrapped,
                LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
            );

            $root = $dom->getElementById('harimi-safe-root');
            if ($root === null) {
                return null;
            }

            self::sanitizeNode($root);

            $out = '';
            foreach (iterator_to_array($root->childNodes) as $child) {
                $out .= $dom->saveHTML($child);
            }

            $out = trim(html_entity_decode($out, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            $out = preg_replace('/(?:<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>\s*)+/iu', '', $out) ?? $out;
            $out = trim($out);

            if ($out === '' || trim(strip_tags($out)) === '') {
                return null;
            }

            return $out;
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
    }

    private static function sanitizeNode(\DOMNode $node): void
    {
        if (! $node->hasChildNodes()) {
            return;
        }

        /** @var list<\DOMNode> $children */
        $children = iterator_to_array($node->childNodes);

        foreach ($children as $child) {
            if ($child instanceof \DOMText) {
                continue;
            }

            if (! $child instanceof \DOMElement) {
                $node->removeChild($child);

                continue;
            }

            $tag = strtolower($child->tagName);

            if (! in_array($tag, self::ALLOWED_TAGS, true)) {
                // Unwrap: keep children, drop the element itself.
                while ($child->firstChild !== null) {
                    $node->insertBefore($child->firstChild, $child);
                }
                $node->removeChild($child);

                continue;
            }

            // Strip all attributes (no style/onclick/href vectors).
            while ($child->hasAttributes()) {
                /** @var \DOMAttr $attr */
                $attr = $child->attributes->item(0);
                $child->removeAttributeNode($attr);
            }

            self::sanitizeNode($child);
        }
    }
}
