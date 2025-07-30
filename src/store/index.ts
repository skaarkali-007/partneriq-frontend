import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import dashboardReducer from './slices/dashboardSlice'
import referralReducer from './slices/referralSlice'
import commissionReducer from './slices/commissionSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    referral: referralReducer,
    commission: commissionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch