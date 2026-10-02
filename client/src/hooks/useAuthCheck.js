import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLazyGetMeQuery } from "../features/auth/authApiSlice";
import { login, logout } from "../features/auth/authSlice";

const useAuthCheck = () => {
  const dispatch = useDispatch();
  const [getMe] = useLazyGetMeQuery();

  useEffect(() => {
    (async () => {
      try {
        const data = await getMe().unwrap();
        dispatch(login(data.user));
      } catch {
        dispatch(logout());
      }
    })();
  }, [dispatch, getMe]);
};

export default useAuthCheck;
