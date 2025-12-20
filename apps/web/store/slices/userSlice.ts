import {createSlice, PayloadAction } from '@reduxjs/toolkit'

export type AuthStatus = 'Authenticated' | 'Unauthenticated'
export interface UserSlice {
    userId: string | null;
    status: AuthStatus
}

const initialState: UserSlice = {
    userId: null,
    status: 'Unauthenticated'
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
        clearUser(){
            return initialState;
        }
    }
})

export const userReducer = userSlice.reducer
export const userAction = userSlice.actions