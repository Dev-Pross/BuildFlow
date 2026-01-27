"use client"
import React, { useState } from 'react'
import Input from '../components/ui/Inputbox'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const Page = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState({email: "", password:"", auth: ""})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const loginHandler = async()=>{
    // Reset all errors
    const newErrors = {email:'', password:'', auth:''}
    
    // Validation
    if(!email){
      newErrors.email = "Email is required"
    } else if(!validateEmail(email)){
      newErrors.email = "Invalid email format"
    }
    
    if(!password){
      newErrors.password = "Password is required"
    } else if(password.length < 8){
      newErrors.password = "Password must be at least 8 characters"
    }
    
    // If there are any errors, set them and return
    if(Object.values(newErrors).some(error => error !== '')){
      setError(newErrors)
      return
    }
    
    setIsLoading(true)
    
    try{
      const result = await signIn("credentials",{
        email,
        password,
        redirect: false
      })
      console.log('res',result);
      
      if(result?.error){
        setError({...newErrors, auth:"Invalid credentials"})
        toast.error("Invalid credentials")
      }
      if(result?.ok){
        toast.success("Login successful!")
        router.push('/workflows')
      }
    } catch(e) {
      setError({...newErrors, auth:"Login failed. Please try again"})
      toast.error("Login failed. Please try again")
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className='bg-black overflow-hidden h-screen flex items-center justify-center'>
        <Card blur="backdrop-blur-xl border border-white/20" color='bg-white/10' width='w-full max-w-sm md:max-w-md' height='max-h-xl h-sm md:h-md'>
              {error.auth && (
                        <span className="text-md w-full inline-flex justify-center text-red-500 animate-pulse">! {error.auth}</span>
                      )}            
              <Input
                label="Email"
                error={error.email}
                startIcon="mail"
                placeholder="eg.: johnguru@build.com"
                type="email"
                onChange={(e)=>{setEmail(e.target.value)}}
            />

            <Input
                label="Password"
                error={error.password}
                startIcon="password"
                placeholder="* * * * *"
                type="password"
                onChange={(e)=>{setPassword(e.target.value)}}
            />
            <Link href='#' className='p-6 py-1 inline-flex   justify-end text-amber-400'>forgot password?</Link>


            <Button 
              onClick={loginHandler} 
              text={isLoading ? 'Logging in...' : 'Login'} 
              variant='solid' 
              size='md' 
              bgColor='bg-green-600' 
              className='w-full mt-4'
              disabled={isLoading}
            />
            <p className='text-white w-full inline-flex justify-center p-2'>New user? <Link href={'/register'}> <span  className='text-blue-600 px-1'>Register</span></Link></p>
        </Card>
    </div>
  )
}

export default Page