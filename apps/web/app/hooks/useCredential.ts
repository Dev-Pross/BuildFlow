"use client"
import { useEffect, useState } from "react"
import { getCredentials } from "../workflow/lib/config"

export const useCredentials = (type: string): any=>{
    const [cred, setCred] = useState<any>()
    const [authUrl, setAuthUrl] = useState<string>()
    useEffect(()=>{
        const fetchCred = async()=>{
            try{
                if(!type) return {}
                const response = await getCredentials(type)
                if(response){
                    console.log(typeof(response))
                    if(typeof(response) === 'string') setAuthUrl(response)
                    else setCred(response)
                    
                        // console.log(response[0].nodeId)
                    console.log(response)
                    return cred

                }
                else return {}
            }
            catch(e){
                console.log(e instanceof Error ? e.message : "unknow error from useCredentials hook")
            }
        }   

        fetchCred()
    },[type])
    return {cred, authUrl}
}