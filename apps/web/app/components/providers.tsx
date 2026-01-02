"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { Provider as ReduxProvider } from "react-redux"
import { store } from "@/store"
import { SessionProvider, useSession } from "next-auth/react"
import { useAppDispatch } from "../hooks/redux"
import { userAction } from "@/store/slices/userSlice"

function SessionSync(){
  const { status, data } = useSession();
  const dispatch = useAppDispatch();

  React.useEffect(()=>{
    if(status === 'authenticated'){
      dispatch(userAction.setUserStatus('Authenticated'));
      const id = (data?.user as any)?.id ?? null;
      // console.log("user from Session Sync ", id)
      dispatch(userAction.setUserId(id))
      dispatch(userAction.setEmail(data.user?.email ? data.user.email : null))
      dispatch(userAction.setUserName(data.user?.name ? data.user.name : null))
    }
    if(status === 'unauthenticated'){
      dispatch(userAction.setUserId(null))
      dispatch(userAction.setUserStatus('Unauthenticated'))
    }
  }, [status, data, dispatch])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (

    <ReduxProvider store={store}>
      <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        enableColorScheme
      >
        <SessionSync />
        {children}
      </NextThemesProvider>
      </SessionProvider>
    </ReduxProvider>
  )
}
