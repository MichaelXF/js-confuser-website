import { useEffect } from "react";

export default function useSEO(
  defaultTitle,
  defaultDescription,
  baseUrl = window.location.origin
) {
  function setSEO(title, description, path = null) {
    // Update title
    document.title = title;

    // Update description
    let descriptionEl = document.querySelector('meta[name="description"]');
    if (description && descriptionEl) {
      descriptionEl.setAttribute("content", description);
    }

    // Handle canonical URL
    let canonicalEl = document.querySelector(
      'link[rel="canonical"][data-managed="true"]'
    );
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      canonicalEl.setAttribute("data-managed", "true");
      document.head.appendChild(canonicalEl);
    }

    // Set canonical URL - use provided path or current pathname
    const canonicalPath = path || window.location.pathname;
    // Clean the path (lowercase, remove trailing slashes)
    const cleanPath = canonicalPath.toLowerCase().replace(/\/+$/, "");
    canonicalEl.setAttribute("href", `${baseUrl}${cleanPath}`);
  }

  // Set default SEO on mount
  useEffect(() => {
    setSEO(defaultTitle, defaultDescription);

    // Cleanup on unmount
    return () => {
      const canonicalEl = document.querySelector(
        'link[rel="canonical"][data-managed="true"]'
      );
      if (canonicalEl) {
        canonicalEl.remove();
      }
    };
  }, []);

  return { setSEO };
}
