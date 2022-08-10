const Router = require("koa-router");
const {
  main,
  login,
  loginError,
  register,
  logged,
  logout,
  info,
  randoms,
  newUser,
  auth,
  loginPost,
  registerPost,
} = require("../service/service");

const router = new Router({
  prefix: "/api",
});

routerDatos.get("/", main);
routerDatos.get("/login", login);
routerDatos.get("/loginError", loginError);
routerDatos.get("/register", register);
routerDatos.get("/logged", logged);
routerDatos.get("/logout", logout);
routerDatos.get("/info", info);
routerDatos.get("/api/randoms/:max", randoms);
routerDatos.get("/newUser", newUser);
routerDatos.get("/auth-bloq", auth);

routerDatos.post("/login", loginPost);
routerDatos.post("/register", registerPost);

module.exports = router;
