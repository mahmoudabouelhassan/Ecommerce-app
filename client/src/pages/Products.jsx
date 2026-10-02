import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductGrid from "../components/ProductGrid/ProductGrid";
import { useGetProductsQuery } from "../features/products/productsApiSlice";
import SearchBar from "../components/SearchBar/SearchBar";
import Filters from "../components/Filters/Filters";
import Pagination from "../components/Pagination/Pagination";

const PRODUCTS_PER_PAGE = 12;

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category") || "all";

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [pageSelection, setPageSelection] = useState({ category: categoryFromUrl, page: 1 });
  const currentPage = pageSelection.category === categoryFromUrl ? pageSelection.page : 1;

  // Keep the selected category in the URL so linked views stay in sync.
  const handleCategoryChange = (category) => {
    setPageSelection({ category, page: 1 });
    const nextParams = new URLSearchParams(searchParams);
    if (category === "all") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", category);
    }
    setSearchParams(nextParams);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPageSelection({ category: categoryFromUrl, page: 1 });
  };
  const handleSortChange = (value) => {
    setSortBy(value);
    setPageSelection({ category: categoryFromUrl, page: 1 });
  };

  const { data, error, isLoading } = useGetProductsQuery({
    category: categoryFromUrl,
    search: searchTerm,
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
    sort: sortBy,
  });

  const handlePageChange = (page) => {
    if (page === currentPage) return;
    setPageSelection({ category: categoryFromUrl, page });
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  if (isLoading)
    return (
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mt-20"></div>
    );

  if (error)
    return (
      <h1 className="text-center mt-10 text-red-500 text-xl font-semibold font-sans">
        Something went Wrong
      </h1>
    );

  return (
    <div
      className="max-w-6xl mx-auto px-4 py-8 min-h-screen"
      style={{ background: "var(--bg-primary)" }}
    >
      <SearchBar onSearch={handleSearch} />
      <Filters
        selectedCategory={categoryFromUrl}
        onCategoryChange={handleCategoryChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
      />
      <ProductGrid products={data?.products || []} />
      <Pagination
        currentPage={data?.currentPage || 1}
        totalPages={data?.totalPages || 1}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default Products;
