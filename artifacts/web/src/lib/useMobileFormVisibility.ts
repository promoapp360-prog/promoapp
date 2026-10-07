import { useEffect } from "react";
export function useMobileFormVisibility(pageKey = "homepage") {
  useEffect(() => {
    const forms = [...document.querySelectorAll(".lead-form, [data-testid='form-preventivo']")];
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target);
      }
      document.body.classList.toggle("lead-form-visible", visible.size > 0);
    });
    for (const form of forms) observer.observe(form);
    return () => { observer.disconnect(); document.body.classList.remove("lead-form-visible"); };
  }, [pageKey]);
}
