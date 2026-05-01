import { configureStore } from "@reduxjs/toolkit";
import quickbooksReducer from "./quickbooksSlice";

export const store = configureStore({
  reducer: {
    quickbooks: quickbooksReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
