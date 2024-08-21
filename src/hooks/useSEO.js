import { useEffect } from "react";

export default function useSEO(title, description) {
  function setSEO(title, description) {
    document.title = title;
    var el = document.querySelector('meta[name="description"]');

    if (description && el) {
      el.setAttribute("content", description);
    }
  }

  useEffect(() => {
    setSEO(title, description);
  }, []);

  return { setSEO };
}
