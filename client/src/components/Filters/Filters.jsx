import { useGetCategoriesQuery } from "../../features/products/productsApiSlice";

function Filters({ selectedCategory, onCategoryChange, sortBy, onSortChange }) {
  // const categories = ["all", "electronics", "fashion", "home", "sports"];
  const { data: categories = [] } = useGetCategoriesQuery(); // ✅ بدل الـ array الثابتة
  const allCategories = ["all", ...categories];
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center gap-5 py-6">
        <div className="flex flex-wrap justify-center gap-3 py-6">
          {allCategories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-5 py-2 rounded-full font-medium transition-all duration-300 border`}
              style={
                selectedCategory.toLowerCase() === category.toLowerCase()
                  ? {
                      background: "#2563EB",
                      color: "#ffffff",
                      borderColor: "#2563EB",
                    }
                  : {
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      borderColor: "var(--border-color)",
                    }
              }
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          style={{
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            borderColor: "var(--border-color)",
          }}
          className="px-4 py-2 rounded-lg border font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="default">Default</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Rating</option>
        </select>
      </div>
    </>
  );
}

export default Filters;
