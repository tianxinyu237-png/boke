package com.devlog.util;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

/**
 * Sanitizes user-submitted content to prevent XSS.
 * Strips all HTML tags and dangerous attributes.
 */
public final class Sanitizer {

    private static final Safelist STRICT = Safelist.none()
            .addTags("b", "i", "em", "strong", "a", "code", "pre")
            .addAttributes("a", "href", "title", "target")
            .addAttributes("code", "class")
            .addProtocols("a", "href", "http", "https", "mailto");

    /** Strip ALL HTML — safe for plain text fields (title, excerpt) */
    public static String plainText(String input) {
        if (input == null) return null;
        return Jsoup.clean(input, Safelist.none());
    }

    /** Allow basic formatting only — safe for content fields */
    public static String richContent(String input) {
        if (input == null) return null;
        return Jsoup.clean(input, STRICT);
    }

    private Sanitizer() {}
}
