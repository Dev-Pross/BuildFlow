"use client"
import React, { useState } from 'react'
import Card from '../components/ui/Card'
import Input  from '../components/ui/Inputbox'
import { useRouter } from 'next/navigation'
import Button from '../components/ui/Button'
import Link from 'next/link'
import axios from 'axios'
import { toast } from 'sonner'

const pages = () => {
    const [formData, setFormData] = useState({user:'', password:'', confirm:'', email:''})
    const [error, setError] = useState({email: "", password:"", auth: "", confirm: "", name:''})
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const validateEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    const registerHandler = async()=>{
        // Reset all errors
        const newErrors = {email:'', password:'', auth:'', confirm:'', name:''}
        
        // Validation
        if(!formData.user.trim()){
          newErrors.name = "Name is required"
        }
        
        if(!formData.email){
          newErrors.email = "Email is required"
        } else if(!validateEmail(formData.email)){
          newErrors.email = "Invalid email format"
        }
        
        if(!formData.password){
          newErrors.password = "Password is required"
        } else if(formData.password.length < 8){
          newErrors.password = "Password must be at least 8 characters"
        }
        
        if(!formData.confirm){
          newErrors.confirm = "Please confirm your password"
        } else if(formData.password !== formData.confirm){
          newErrors.confirm = "Passwords do not match"
        }
        
        // If there are any errors, set them and return
        if(Object.values(newErrors).some(error => error !== '')){
          setError(newErrors)
          return
        }
        
        setIsLoading(true)
        
        try{
          const result = await axios.post('/api/auth',{
            email: formData.email,
            password: formData.password,
            name: formData.user
          })
          
          if(result.data){
            console.log(result.data);
            toast.success("Registration successful! Please login")
            router.push('/login')
          }
        }catch(e: any){
          console.log("Error from server", e);
          
          if(e.response?.status === 409){
            setError({...newErrors, auth: "User already exists"})
            toast.error("User already exists")
          } else if(e.response?.status === 400){
            setError({...newErrors, auth: "Invalid data provided"})
            toast.error("Invalid data provided")
          } else {
            setError({...newErrors, auth: "Registration failed. Please try again"})
            toast.error("Registration failed. Please try again")
          }
        } finally {
          setIsLoading(false)
        }
      }
  return (
    <>
      <div className='bg-black h-screen overflow-hidden flex justify-center items-center'>
        <Card blur="backdrop-blur-xl border border-white/20" color='bg-white/10' width='w-full max-w-sm md:max-w-md' height='max-h-xl h-sm md:h-md'>
            {error.auth && (
              <span className="text-md w-full inline-flex justify-center text-red-500 animate-pulse">! {error.auth}</span>
            )}
            <Input
                label="Name"
                error={error.name}
                startIcon="user"
                placeholder="eg.: John"
                type="text"
                onChange={(e)=>{setFormData({...formData , user:e.target.value})}}
            />
            <Input
                label="Email"
                error={error.email}
                startIcon="mail"
                placeholder="eg.: Johnguru@build.com"
                type="email"
                onChange={(e)=>{setFormData({...formData , email:e.target.value})}}
            />
            <Input
                label="Password"
                error={error.password}
                startIcon="password"
                placeholder="* * * * *"
                type="password"
                onChange={(e)=>{setFormData({...formData , password:e.target.value})}}
            />
            <Input
                label="Confirm Password"
                error={error.confirm}
                startIcon="password"
                placeholder="* * * * *"
                type="password"
                onChange={(e)=>{setFormData({...formData , confirm:e.target.value})}}
            />

            <Button 
              onClick={registerHandler} 
              text={isLoading ? 'Registering...' : 'Register'} 
              variant='solid' 
              size='md' 
              bgColor='bg-green-600' 
              className='w-full mt-4'
              disabled={isLoading}
            />
            <p className='text-white w-full inline-flex justify-center p-2'>Already registered? <Link href={'/login'}> <span  className='text-blue-600 px-1'>Login</span></Link></p>
        </Card>
      </div>
    </>
  )
}

export default pages