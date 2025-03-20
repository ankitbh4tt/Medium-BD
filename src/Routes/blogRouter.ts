import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import {createBlogInput, CreateBlogInput,updateBlogInput,UpdateBlogInput} from "medium-demo-project-npm"

export const blogRouter = new Hono<{
    Bindings:{
        DATABASE_URL:string,
        JWT_SECRET:string
    },
    Variables:{
        userId:string
    }
}>()


// midddleware
blogRouter.use('/*',async(c,next)=>{
    // get the header 
    const header = c.req.header("authorization")||"";
    const token = header.split(' ')[1];
    const user = await verify(token,c.env.JWT_SECRET);
  
    if(user ){
        // @ts-ignore
        c.set("userId",user.id)
        await next()
    }else{
      c.status(403)
      return c.json({error:"unathorized"})
    }
  
    // verify the header
    // if the header is correct ,call next
    // otherwise return 403 unauthorized
  })

blogRouter.post('/',async(c)=>{
    const body = await c.req.json()
    const userId = c.get('userId')
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    const {success} = createBlogInput.safeParse(body)
    if(!success){
        c.status(411)
        return c.json({
            message:"Inputs are not correct.Please check again and submit!"
        })
    }
    const blog = await prisma.post.create({
        data:{
            title:body.title,
            content:body.content,
            authorId:userId
        }
    })

    return c.json({
        id:blog.id
    });
}) 

blogRouter.put('/',async(c)=>{
    const body = await c.req.json()
    const {success} = updateBlogInput.safeParse(body)
    if(!success){
        c.status(411)
        return c.json({
            message:"Inputs are not correct.Please check again and submit!"
        })
    }
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog = await prisma.post.update({
        where:{
            id:body.id
        },
        data:{
            title:body.title,
            content:body.content,
        }   
    })

    return c.json({
        id:blog.id
    });
})

blogRouter.get("/:id",async (c)=>{
    const id = await c.req.param("id")
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try {
        const blog = await prisma.post.findFirst({
            where:{
                id:id
            }
        })
        return c.json({
            blog
        });
    } catch (error) {
        c.status(411);
        return c.json({
            message:"Error while fetching blog post"
        })
    }


})
blogRouter.get("/bulk",async(c)=>{
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    try {
        const blogs = await prisma.post.findMany({})
        return c.json({blogs})
    } catch (error) {
        c.status(411)
        return c.json({
            message:"Error while fetching blog post"
        })
    }
})