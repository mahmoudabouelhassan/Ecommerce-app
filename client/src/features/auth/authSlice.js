import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  authChecked: false,
};
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = {
        name: action.payload.name,
        email: action.payload.email,
        role: action.payload.role || "customer",
      };
      state.authChecked = true;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.authChecked = true;
    },
    setAuthChecked: (state) => {
      state.authChecked = true;
    },
  },
});

export const { login, logout, setAuthChecked } = authSlice.actions;
export default authSlice.reducer;
