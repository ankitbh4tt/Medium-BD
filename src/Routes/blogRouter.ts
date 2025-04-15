import { Prisma, PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Context, Hono } from "hono";
import { verify } from "hono/jwt";
import {getCookie} from "hono/cookie"
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
blogRouter.use('/*', async (c, next) => {
    try {
      // Get the header
      const header = c.req.header('Authorization');
      const token = header?.split(' ')[1] || '';
  
      if (!token) {
        c.status(401); // Unauthorized if no token
        return c.json({ error: "No token provided" });
      }
  
      // Verify the token
      const user = await verify(token, c.env.JWT_SECRET);
      if (!user) {
        c.status(403); // Forbidden if token is invalid
        return c.json({ error: "Unauthorized" });
      }
  
      // @ts-ignore
      c.set("userId", user.id);
      await next();
    } catch (error) {
      console.error("Authentication error:", error); // Log the error for debugging
      c.status(500); // Internal server error for unexpected issues
      return c.json({ message: "Internal server error during authentication",error });
    }
  });

blogRouter.get('/isAuthenticated',async(c)=>{
    const userId = c.get('userId')
    if(!userId){
        c.status(401)
        return c.json({"message":"Please make sure to login in",auth:false})
    }

    return c.json({userId,"auth":true})

})

blogRouter.post('/',async(c)=>{
    const body = await c.req.json()
    const userId = c.get('userId')
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    const result = createBlogInput.safeParse(body)
    const success = result.success
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

blogRouter.get("/bulk",async(c)=>{
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    try {
        const blogs = await prisma.post.findMany({});
        console.log("Fetched blogs (raw):", blogs); // Detailed debug log
        if (blogs.length === 0) {
          console.log("No blogs found in the database (unexpected since SQL shows data)");
          return c.json({ blogs: [] });
        }
        return c.json({ blogs }); // Explicitly return { blogs }
      } catch (error) {
        console.error("Error fetching blogs:", error);
        c.status(500);
        return c.json({
          message: "Error while fetching blog posts",
        });
      }
})


interface Blog {
    id: string;
    title: string;
    content: string;
    published: boolean;
  }
  
  interface ErrorResponse {
    message: string;
  }
  
  blogRouter.get('/:id', async (c: Context) => {
    const id = await c.req.param('id');
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
  
    try {
      const blog = await prisma.post.findFirst({
        where: { id },
        select: {
          id: true,
          title: true,
          content: true,
          published: true,
        },
      });
  
      if (!blog) {
        c.status(404);
        return c.json<ErrorResponse>({ message: 'Blog post not found!' });
      }
  
      return c.json<{ blog: Blog }>({ blog });
    } catch (error: unknown) {
      // Log error for debugging
      console.error('Error fetching blog post:', error);
  
      // Type narrowing for Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          c.status(404);
          return c.json<ErrorResponse>({ message: 'Blog post not found' });
        }
        c.status(400);
        return c.json<ErrorResponse>({ message: 'Invalid blog post ID' });
      }
  
      if (error instanceof Prisma.PrismaClientValidationError) {
        c.status(400);
        return c.json<ErrorResponse>({ message: 'Invalid query parameters' });
      }
  
      // Generic server error
      c.status(500);
      return c.json<ErrorResponse>({ message: 'Internal server error' });
    } finally {
      await prisma.$disconnect();
    }
  });
