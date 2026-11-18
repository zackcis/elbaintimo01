<?php

namespace Tests\Unit;

use App\Support\SafeHtml;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SafeHtmlTest extends TestCase
{
    #[Test]
    public function it_keeps_plain_text_descriptions(): void
    {
        $this->assertSame(
            "Line one\nLine two",
            SafeHtml::productDescription("Line one\nLine two")
        );
    }

    #[Test]
    public function it_allows_bold_italic_and_highlight(): void
    {
        $html = '<p>Hello <strong>bold</strong> <em>italic</em> <mark>hi</mark></p>';
        $out = SafeHtml::productDescription($html);

        $this->assertNotNull($out);
        $this->assertStringContainsString('<strong>bold</strong>', $out);
        $this->assertStringContainsString('<em>italic</em>', $out);
        $this->assertStringContainsString('<mark>hi</mark>', $out);
    }

    #[Test]
    public function it_strips_scripts_and_event_handlers(): void
    {
        $html = '<p onclick="alert(1)">Safe <script>alert(2)</script><img src=x onerror=alert(3)> text</p>';
        $out = SafeHtml::productDescription($html);

        $this->assertNotNull($out);
        $this->assertStringNotContainsString('<script', $out);
        $this->assertStringNotContainsString('onclick', $out);
        $this->assertStringNotContainsString('<img', $out);
        $this->assertStringNotContainsString('onerror', $out);
        $this->assertStringContainsString('Safe', $out);
        $this->assertStringContainsString('text', $out);
    }

    #[Test]
    public function it_returns_null_for_empty_editor_html(): void
    {
        $this->assertNull(SafeHtml::productDescription('<p></p>'));
        $this->assertNull(SafeHtml::productDescription('<p><br></p>'));
        $this->assertNull(SafeHtml::productDescription('   '));
        $this->assertNull(SafeHtml::productDescription(null));
    }
}
