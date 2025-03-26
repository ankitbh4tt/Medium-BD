import { PrismaClient,Prisma } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import {signupInput,SigninInput, signinInput} from "medium-demo-project-npm"

export const userRouter = new Hono<{
    Bindings:{
      DATABASE_URL:string,
      JWT_SECRET:string
    }
  }>()

// c is stand for context=>req,res
userRouter.post('/signup',async(c)=>{
  const prisma = new PrismaClient({
    datasourceUrl:c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  const body = await c.req.json();
  const {success} = signupInput.safeParse(body)
  if(!success){
    c.status(411)
    return c.json({
      message:"Inputs not correct !"
    })
  }
    console.log(body.username)
    console.log(body)
    try {
        const user =await prisma.user.create({
            data:{ 
              email:body.username,
              password:body.password
            } 
          })
        
          const token = await sign({id:user.id},c.env.JWT_SECRET)
        
          return c.json({
            jwt:token
          });
    }catch (error: unknown) {
      console.log('Error:', error);
  
      // Type guard to check if it's a PrismaClientKnownRequestError
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          c.status(409);
          return c.json({
            message: 'This email is already registered',
            field: 'email',
          });
        }
        // Handle other known Prisma errors if needed
        c.status(500);
        return c.json({
          message: 'A database error occurred',
          error: error.message,
        });
      }
  
      // Handle non-Prisma errors
      c.status(500);
      return c.json({
        message: 'An unexpected error occurred during signup',
        error: String(error), // Convert unknown error to string
      });
    }
})
  
userRouter.post('/signin',async (c)=>{

const prisma = new PrismaClient({
    datasourceUrl:c.env.DATABASE_URL,
}).$extends(withAccelerate())

const body = await c.req.json()
const {success} = signinInput.safeParse(body)
if(!success){
  c.status(411)
  return c.json({
    message:"Inputs not correct !"
  })
}

const user = await prisma.user.findUnique({
    where:{
    email:body.email,
    password:body.password
    }
})
console.log(user)
if(!user){
    c.status(403)
    return c.json({error:"User not found"});
}
const jwt = await sign({id:user.id},c.env.JWT_SECRET);
return c.json({jwt})

})