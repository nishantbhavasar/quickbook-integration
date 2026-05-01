import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type QuickbooksState = {
  connected: boolean;
  connection: any;
};

const initialState: QuickbooksState = {
  connected: false,
  connection: null,
};

const quickbooksSlice = createSlice({
  name: "quickbooks",
  initialState,
  reducers: {
    setConnection(
      state,
      action: PayloadAction<{ connected: boolean; connection: any }>
    ) {
      state.connected = action.payload.connected;
      state.connection = action.payload.connection;
    },
    resetQuickbooks: () => ({ ...initialState }),
  },
});

export const { setConnection, resetQuickbooks } = quickbooksSlice.actions;
export default quickbooksSlice.reducer;
