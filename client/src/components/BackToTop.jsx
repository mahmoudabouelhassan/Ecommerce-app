import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 500);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      title="Back to top"
      onClick={() => window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      })}
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition hover:-translate-y-1 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <ArrowUp size={22} aria-hidden="true" />
    </button>
  );
}

export default BackToTop;
