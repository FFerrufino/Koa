const Koa = require("koa");
const koaBody = require("koa-body");
const app = new Koa();

app.use(koaBody());

let commerce = require("./routes/commerce.js");

app.use(commerce.routes());

app.use((ctx) => {
  ctx.body = "Hello Koa";
});

app.listen(3000);
