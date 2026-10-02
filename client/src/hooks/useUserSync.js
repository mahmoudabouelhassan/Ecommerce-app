import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useLazyGetUserDataQuery,
  useUpdateCartMutation,
  useUpdateWishlistMutation,
} from "../features/auth/authApiSlice";
import { setCart } from "../features/cart/cartSlice";
import { setWishlist } from "../features/wishlist/wishlistSlice";

const useUserSync = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const cartItems = useSelector((state) => state.cart.items);
  const wishlistItems = useSelector((state) => state.wishlist.wishlistItems);

  const [fetchUserData] = useLazyGetUserDataQuery();
  const [updateCart] = useUpdateCartMutation();
  const [updateWishlist] = useUpdateWishlistMutation();

  const hasHydrated = useRef(false);

  // 1) لما اليوزر يعمل login، نجيب الداتا من الـ DB ونحقن الـ Redux
  useEffect(() => {
    if (!isAuthenticated) {
      hasHydrated.current = false;
      return;
    }
    (async () => {
      try {
        const data = await fetchUserData().unwrap();
        dispatch(setCart(data.cartItems || []));
        dispatch(setWishlist(data.wishlistItems || []));
      } catch (err) {
        console.error("Failed to sync user data:", err);
      } finally {
        hasHydrated.current = true;
      }
    })();
  }, [dispatch, fetchUserData, isAuthenticated]);

  // 2) أي تغيير في الـ cart بعد الـ hydration يتبعت للـ DB (مع debounce)
  useEffect(() => {
    if (!isAuthenticated || !hasHydrated.current) return;
    const timeout = setTimeout(() => updateCart(cartItems), 600);
    return () => clearTimeout(timeout);
  }, [cartItems, isAuthenticated, updateCart]);

  // 3) نفس الحكاية للـ wishlist
  useEffect(() => {
    if (!isAuthenticated || !hasHydrated.current) return;
    const timeout = setTimeout(() => updateWishlist(wishlistItems), 600);
    return () => clearTimeout(timeout);
  }, [wishlistItems, isAuthenticated, updateWishlist]);
};

export default useUserSync;
