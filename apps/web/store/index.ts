import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "./root-reducer";

export const makeStore = ()=> configureStore({
    reducer: rootReducer,
    devTools: process.env.NODE_ENV !== 'production'
})

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>