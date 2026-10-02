import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import { combineReducers } from "@reduxjs/toolkit";
import cartReducer from "../features/cart/cartSlice";
import wishlistReducer from "../features/wishlist/wishlistSlice";
import { productsApiSlice } from "../features/products/productsApiSlice";
import authReducer from "../features/auth/authSlice";
import authApiSlice from "../features/auth/authApiSlice";
import { setupListeners } from "@reduxjs/toolkit/query";

// في store.js بدل import storage
const storage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
};
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["cart", "wishlist"],
};
const rootReducer = combineReducers({
  cart: cartReducer,
  wishlist: wishlistReducer,
  auth: authReducer,
  [productsApiSlice.reducerPath]: productsApiSlice.reducer,
  [authApiSlice.reducerPath]: authApiSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    })
      .concat(productsApiSlice.middleware)
      .concat(authApiSlice.middleware),
});
setupListeners(store.dispatch);
export const persistor = persistStore(store);
export default store;

// const store = configureStore({
//   reducer: {
//     cart: cartReducer,
//     [productsApiSlice.reducerPath]: productsApiSlice.reducer,
//     wishlist: wishlistReducer,
//     auth: authReducer,
//     [authApiSlice.reducerPath]: authApiSlice.reducer,
//   },
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware()
//       .concat(productsApiSlice.middleware)
//       .concat(authApiSlice.middleware),
// });
// export default store;
