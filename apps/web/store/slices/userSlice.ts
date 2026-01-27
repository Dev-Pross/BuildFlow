import {createSlice, PayloadAction } from '@reduxjs/toolkit'

export type AuthStatus = 'Authenticated' | 'Unauthenticated'
export interface UserSlice {
    userId: string | null;
    status: AuthStatus;
    email: string | null;
    name: string | null;
}

const initialState: UserSlice = {
    userId: null,
    status: 'Unauthenticated',
    email: null,
    name: null
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers:{
setUserId(state, action: PayloadAction<string |null>){
            state.userId = action.payload;
        },
        setUserStatus(state, action: PayloadAction<AuthStatus>){
            state.status = action.payload;
        },
        setUserName(state, action: PayloadAction<string | null>){
            state.name = action.payload
        },
        setEmail(state, action: PayloadAction<string | null>){
            state.email = action.payload
        },
        clearUser(){
            return initialState;
        }
    }
})

export const userReducer = userSlice.reducer
export const userAction = userSlice.actions