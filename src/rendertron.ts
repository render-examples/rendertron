import * as Koa from 'koa';
import * as puppeteer from 'puppeteer';

(async ()=>{

  const port = process.env.PORT || 3001;
  const app = new Koa();
  const browser = await puppeteer.launch({args: ['--no-sandbox']});

  app.get("/",(req.res)=>{
    res.send("hello world")
  })  
})()
