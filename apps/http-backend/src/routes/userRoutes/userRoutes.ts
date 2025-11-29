import { prismaClient } from "@repo/db";
import { Express, Router } from "express";

const router : Router = Router();

router.post("/create" , async (req  , res) =>{

    // const Data = req.body;
    
    // const {name , email , password} = req.body
    // console.log(Data)
    try {
        const user = await prismaClient.user.create({
            data : {
                name : "name",
                email : "email",
                password : "password"
            }
        })
        res.json({
            message : "Signup DOne",
            user
        })
    }
  catch(e){
    console.log("Detailed Error" , e)
  }
})

export const  userRouter  = router ;