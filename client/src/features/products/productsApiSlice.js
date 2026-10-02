import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const productsApiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL ||
      (import.meta.env.DEV ? "http://localhost:5000/api" : undefined),
    credentials: "include",
  }),
  tagTypes: ["Product", "Order", "CashOrder", "StockIssue", "AdminOverview", "AdminProduct", "StockAdjustment", "StoreSettings", "Taxonomy"],
  endpoints: (build) => ({
    getProducts: build.query({
      // query: () => "products",
      query: ({ category, search, page, limit, sort } = {}) => {
        const params = new URLSearchParams();
        if (category && category !== "all") params.append("category", category);
        if (search) params.append("search", search);
        if (page) params.append("page", page);
        if (limit) params.append("limit", limit);
        if (sort) params.append("sort", sort);
        return `products?${params.toString()}`;
      },
      providesTags: ["Product"],
    }),
    getProductById: build.query({
      query: (id) => `products/${id}`,
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),
    getCategories: build.query({
      query: () => "products/categories",
      providesTags: ["Product"],
    }),
    createCheckoutSession: build.mutation({
      query: (orderData) => ({
        url: "orders/create-checkout-session",
        method: "POST",
        body: orderData,
      }),
    }),
    createCashOnDeliveryOrder: build.mutation({
      query: (orderData) => ({
        url: "orders/cash-on-delivery",
        method: "POST",
        body: orderData,
      }),
      invalidatesTags: ["Product", "Order", "CashOrder", "AdminOverview", "AdminProduct"],
    }),
    getCategoriesWithImage: build.query({
      query: () => "products/categories-with-image",
      providesTags: ["Product"],
    }),
    getRelatedProducts: build.query({
      query: (id) => `products/${id}/related`,
      providesTags: ["Product"],
    }),
    getMyOrders: build.query({
      query: () => "orders",
      providesTags: ["Order"],
    }),
    cancelCashOnDeliveryOrder: build.mutation({
      query: (id) => ({ url: `orders/${id}/cancel`, method: "PATCH" }),
      invalidatesTags: ["Product", "Order", "CashOrder", "AdminOverview", "AdminProduct"],
    }),
    getCashOnDeliveryOrders: build.query({
      query: () => "orders/admin/cash-on-delivery",
      providesTags: ["CashOrder"],
    }),
    getStockIssues: build.query({
      query: () => "orders/admin/stock-issues",
      providesTags: ["StockIssue"],
    }),
    confirmCashCollection: build.mutation({
      query: (id) => ({ url: `orders/admin/cash-on-delivery/${id}/collect`, method: "PATCH" }),
      invalidatesTags: ["Order", "CashOrder", "AdminOverview"],
    }),
    getPublicSettings: build.query({ query: () => "store-settings", providesTags: ["StoreSettings"] }),
    getAdminSettings: build.query({ query: () => "admin/settings", providesTags: ["StoreSettings"] }),
    updateAdminSettings: build.mutation({
      query: (body) => ({ url: "admin/settings", method: "PATCH", body }),
      invalidatesTags: ["StoreSettings", "AdminOverview", "AdminProduct"],
    }),
    getAdminOverview: build.query({ query: () => "admin/overview", providesTags: ["AdminOverview"] }),
    getAdminCategories: build.query({ query: () => "admin/categories", providesTags: ["Taxonomy"] }),
    createCategory: build.mutation({ query: (body) => ({ url: "admin/categories", method: "POST", body }), invalidatesTags: ["Taxonomy", "Product"] }),
    updateCategory: build.mutation({ query: ({ key, name }) => ({ url: `admin/categories/${encodeURIComponent(key)}`, method: "PATCH", body: { name } }), invalidatesTags: ["Taxonomy", "Product", "AdminProduct", "AdminOverview"] }),
    deleteCategory: build.mutation({ query: ({ key, replacement }) => ({ url: `admin/categories/${encodeURIComponent(key)}`, method: "DELETE", body: { replacement } }), invalidatesTags: ["Taxonomy", "Product", "AdminProduct", "AdminOverview"] }),
    getAdminBadges: build.query({ query: () => "admin/badges", providesTags: ["Taxonomy"] }),
    createBadge: build.mutation({ query: (body) => ({ url: "admin/badges", method: "POST", body }), invalidatesTags: ["Taxonomy"] }),
    updateBadge: build.mutation({ query: ({ id, body }) => ({ url: `admin/badges/${id}`, method: "PATCH", body }), invalidatesTags: ["Taxonomy", "Product", "AdminProduct"] }),
    deleteBadge: build.mutation({ query: (id) => ({ url: `admin/badges/${id}`, method: "DELETE" }), invalidatesTags: ["Taxonomy", "Product", "AdminProduct"] }),
    getAdminProducts: build.query({
      query: ({ page = 1, search = "", stock = "all" } = {}) => `admin/products?${new URLSearchParams({ page, search, stock })}`,
      providesTags: ["AdminProduct"],
    }),
    createAdminProduct: build.mutation({
      query: (body) => ({ url: "admin/products", method: "POST", body }),
      invalidatesTags: ["Product", "AdminProduct", "AdminOverview", "Taxonomy"],
    }),
    updateAdminProduct: build.mutation({
      query: ({ id, body }) => ({ url: `admin/products/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Product", "AdminProduct", "AdminOverview", "Taxonomy"],
    }),
    previewProductImport: build.mutation({
      query: (body) => ({ url: "admin/products/import/preview", method: "POST", body }),
    }),
    importProducts: build.mutation({
      query: (body) => ({ url: "admin/products/import", method: "POST", body }),
      invalidatesTags: ["Product", "AdminProduct", "AdminOverview", "Taxonomy"],
    }),
    archiveAdminProduct: build.mutation({
      query: (id) => ({ url: `admin/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["Product", "AdminProduct", "AdminOverview", "Taxonomy"],
    }),
    restoreAdminProduct: build.mutation({
      query: (id) => ({ url: `admin/products/${id}/restore`, method: "PATCH" }),
      invalidatesTags: ["Product", "AdminProduct", "AdminOverview", "Taxonomy"],
    }),
    adjustAdminStock: build.mutation({
      query: ({ id, change, reason }) => ({ url: `admin/products/${id}/stock`, method: "PATCH", body: { change, reason } }),
      invalidatesTags: ["Product", "AdminProduct", "AdminOverview", "StockAdjustment"],
    }),
    getStockAdjustments: build.query({ query: () => "admin/stock-adjustments", providesTags: ["StockAdjustment"] }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetCategoriesQuery,
  useCreateCheckoutSessionMutation,
  useCreateCashOnDeliveryOrderMutation,
  useGetCategoriesWithImageQuery,
  useGetRelatedProductsQuery,
  useGetMyOrdersQuery,
  useCancelCashOnDeliveryOrderMutation,
  useGetCashOnDeliveryOrdersQuery,
  useGetStockIssuesQuery,
  useConfirmCashCollectionMutation,
  useGetPublicSettingsQuery,
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useGetAdminOverviewQuery,
  useGetAdminCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetAdminBadgesQuery,
  useCreateBadgeMutation,
  useUpdateBadgeMutation,
  useDeleteBadgeMutation,
  useGetAdminProductsQuery,
  useCreateAdminProductMutation,
  useUpdateAdminProductMutation,
  usePreviewProductImportMutation,
  useImportProductsMutation,
  useArchiveAdminProductMutation,
  useRestoreAdminProductMutation,
  useAdjustAdminStockMutation,
  useGetStockAdjustmentsQuery,
} = productsApiSlice;
