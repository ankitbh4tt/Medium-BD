import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";

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
    console.log(body.username)
    console.log(body)
    try {
        const user =await prisma.user.create({
            data:{ 
              email:body.email,
              password:body.password
            } 
          })
        
          const token = await sign({id:user.id},c.env.JWT_SECRET)
        
          return c.json({
            jwt:token
          });
    } catch (error) {
        c.status(411)
        
    }
})
  
userRouter.post('/signin',async (c)=>{

const prisma = new PrismaClient({
    datasourceUrl:c.env.DATABASE_URL,
}).$extends(withAccelerate())

const body = await c.req.json()
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