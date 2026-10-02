import { Link } from "react-router-dom";
import { useGetPublicSettingsQuery } from "../../features/products/productsApiSlice";

const Footer = () => {
  const { data: settings } = useGetPublicSettingsQuery();
  const storeName = settings?.storeName || "MyStore";
  const supportEmail = settings?.supportEmail || "support@mystore.com";
  return (
    <footer
      className="  mt-auto"
      style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-color)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <h3
            className=" font-bold text-lg mb-2"
            style={{
              color: "var(--text-primary)",
            }}
          >
            {storeName}
          </h3>
          <p style={{ color: "var(--text-secondary)" }} className="text-sm">
            Your one-stop shop for everything you need.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4
            className=" font-semibold mb-3"
            style={{
              color: "var(--text-primary)",
            }}
          >
            Quick Links
          </h4>
          <ul className="space-y-2 text-sm">
            {[
              { to: "/", label: "Home" },
              { to: "/products", label: "Products" },
              { to: "/cart", label: "Cart" },
              { to: "/wishlist", label: "Wishlist" },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  style={{ color: "var(--text-secondary)" }}
                  className="hover:text-blue-600 transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Copy */}
        <div>
          <h4
            className=" font-semibold mb-3"
            style={{
              color: "var(--text-primary)",
            }}
          >
            Contact
          </h4>
          <p style={{ color: "var(--text-secondary)" }} className="text-sm">
            <a href={`mailto:${supportEmail}`} className="hover:text-blue-600">{supportEmail}</a>
          </p>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--border-color)",
          color: "var(--text-secondary)",
        }}
        className="text-center text-sm py-2"
      >
        © {new Date().getFullYear()} {storeName}. All rights reserved.
      </div>
      <div className="text-center text-sm pb-1 text-blue-700 font-bold">
        Created By Abdelmajeed
      </div>
    </footer>
  );
};

export default Footer;
