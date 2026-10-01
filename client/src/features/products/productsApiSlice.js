import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const productsApiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL ||
      (import.meta.env.DEV ? "http://localhost:5000/api" : undefined),
    credentials: "include",
  }),
  tagTypes: ["Product"],
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
    }),
    createCheckoutSession: build.mutation({
      query: (orderData) => ({
        url: "orders/create-checkout-session",
        method: "POST",
        body: orderData,
      }),
    }),
    getCategoriesWithImage: build.query({
      query: () => "products/categories-with-image",
    }),
    getRelatedProducts: build.query({
      query: (id) => `products/${id}/related`,
    }),
    getMyOrders: build.query({
      query: () => "orders",
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetCategoriesQuery,
  useCreateCheckoutSessionMutation,
  useGetCategoriesWithImageQuery,
  useGetRelatedProductsQuery,
  useGetMyOrdersQuery,
} = productsApiSlice;
