import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "./root-reducer";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PURGE, PERSIST, REGISTER } from "redux-persist";


function createNoopStorage(){
    return {
        getItem() { return Promise.resolve(null)},
        setItem(_key: string, value: any) { return Promise.resolve(value) },
        removeItem() { return Promise.resolve()}
    }
}

const createStorage = ()=> {
    if(typeof window !== 'undefined'){
        return require('redux-persist/lib/storage').default
    }
    return createNoopStorage();
}

const persistConfig = {
    key: 'buildflow-workflow',
    storage: createStorage(),
    whitelist: ['workflow']
}

const persistedReducer = persistReducer(persistConfig, rootReducer)
export const store = configureStore({
    reducer: persistedReducer,
    devTools: process.env.NODE_ENV !== 'production',
    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REGISTER, REHYDRATE, PAUSE, PERSIST, PURGE ]
            }
        })
})

export const persistor = persistStore(store);

export type AppStore = typeof store