const cookieParser = require("cookie-parser");
const session = require("koa-session");
const connectMongo = require("connect-mongo");
const bodyParser = require("body-parser");
const exphbs = require("koa-handlebars");
const path = require("path");
const bcrypt = require("bcrypt");
const User = require("./models/user");
const contenedorMongoose = require("../daos/mongoCont");
const config = require("./config");
const { fork } = require("child_process");
const cluster = require("cluster");
const http = require("http");
const numCPUs = require("os").cpus().length;
const compression = require("express");
const log4js = require("log4js");
const crypto = require("crypto");
const createTransport = require("nodemailer");
const twilio = require("twilio");

const passport = require("passport");
const { Strategy } = require("passport-local");
const LocalStrategy = Strategy;

const MongoStore = connectMongo.create({
  mongoUrl: config.KEY,
  ttl: 600,
});

//LOGS
log4js.configure({
  appenders: {
    consola: { type: "console" },
    archivoW: { type: "file", filename: "warnings.log" },
    archivoE: { type: "file", filename: "errors.log" },

    loggerConsola: {
      type: "logLevelFilter",
      appender: "consola",
      level: "info",
    },
    loggerArchivoW: {
      type: "logLevelFilter",
      appender: "archivoW",
      level: "warning",
    },
    loggerArchivoE: {
      type: "logLevelFilter",
      appender: "archivoE",
      level: "error",
    },
  },
  categories: {
    default: {
      appenders: ["loggerConsola"],
      level: "all",
    },
    file: {
      appenders: ["loggerArchivoW"],
      level: "all",
    },
    file2: {
      appenders: ["loggerArchivoE"],
      level: "all",
    },
  },
});

const logger = log4js.getLogger();
const loggerError = log4js.getLogger("file2");
const loggerWarning = log4js.getLogger("file");

//Motor de plantillas
app.set("views", path.join(path.dirname(""), "./srcHtml/views"));
app.engine(
  ".hbs",
  exphbs.engine({
    defaultLayout: "main",
    layoutsDir: path.join(app.get("views"), "layouts"),
    extname: ".hbs",
  })
);
app.set("view engine", ".hbs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

//Bcrypt
async function createHash(password) {
  const saltRounds = 10;

  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.log(error);
  }
}

async function verificaPass(usuario, password) {
  const saltRounds = 10;
  console.log("old pass hash: ", usuario.password);
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);

    console.log("new pass hash: ", hash);
    bcrypt.compare(usuario.password, hash, function (err, result) {
      if (result) {
        console.log("It matches!");
        return true;
      } else {
        console.log("Invalid password!");
        return false;
      }
    });
  } catch (error) {
    console.log(error);
  }
}

//Session
app.use(cookieParser());
app.use(
  session({
    store: MongoStore,
    secret: ".",
    resave: false,
    saveUninitialized: false,
  })
);

//Passport

passport.use(
  new LocalStrategy(async (username, password, done) => {
    const bd = new contenedorMongoose(User);
    let coll = await bd.read().then();
    const existeUsuario = coll.find((usuario) => {
      return usuario.username == username;
    });

    console.log(existeUsuario);

    if (!existeUsuario) {
      console.log("Usuario no encontrado");
      return done(null, false);
    }

    if (await verificaPass(existeUsuario, password)) {
      console.log("Contrase;a invalida");
      return done(null, false);
    }

    return done(null, existeUsuario);
  })
);

passport.serializeUser((usuario, done) => {
  console.log(usuario.username);
  done(null, usuario.username);
});

passport.deserializeUser(async (nombre, done) => {
  const bd = new contenedorMongoose(User);
  let coll = await bd.read().then();
  const usuario = coll.find((usuario) => usuario.username == nombre);
  console.log(usuario);
  done(null, usuario);
});

// Rutas

async function main(ctx) {
  if (req.session.username) {
    ctx.response.redirect("/datos");
  } else {
    ctx.response.redirect("/login");
  }
}

async function login(ctx) {
  ctx.response.redirect("login");
}

async function loginError(ctx) {
  ctx.response.render("loginError");
}

async function register(ctx) {
  ctx.response.render("register");
}

async function logged(ctx) {
  console.log("logged req.user: ", ctx.request);
  console.log("logged req.user: ", ctx.request.session.passport.user);
  console.log(ctx.request.session.passport);
  const datosUsuario = {
    nombre: ctx.request.session.passport.user.username,
    direccion: ctx.request.session.passport.user.email,
  };
  ctx.response.render("logged", {
    contador: ctx.request.user.contador,
    datos: datosUsuario,
  });
}

async function logout(ctx) {
  ctx.request.logOut();
  ctx.response.redirect("/");
}

async function info(ctx) {
  let inf = [
    process.platform,
    process.version,
    process.memoryUsage(),
    process.cwd(),
    process.pid,
  ];
  logger.info("");
  loggerWarning.warn();
  loggerError.error();
  console.log(inf);
}

async function randoms(ctx) {
  const ran = fork("child.js");

  ran.on("message", (msg) => {
    if (msg == "listo") {
      ran.send(ctx.request.params.max);
    } else {
      res.response.send(msg);
    }
  });
}

const users = {};

async function newUser(ctx) {
  let username = ctx.request.query.username || "";
  const password = ctx.request.query.password || "";

  username = username.replace(/[!@#$%^&*]/g, "");

  if (!username || !password || users[username]) {
    return ctx.response.sendStatus(400);
  }

  const salt = crypto.randomBytes(128).toString("base64");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 512, "sha512");

  users[username] = { salt, hash };
  console.log("Success");
  ctx.response.sendStatus(200);
}

async function auth(req, res) {
  let username = ctx.request.query.username || "";
  const password = ctx.request.query.password || "";

  username = username.replace(/[!@#$%^&*]/g, "");

  if (!username || !password || !users[username]) {
    process.exit(1);
    return ctx.response.sendStatus(400);
  }

  const { salt, hash } = users[username];
  const encryptHash = crypto.pbkdf2Sync(password, salt, 10000, 512, "sha512");

  if (crypto.timingSafeEqual(hash, encryptHash)) {
    ctx.response.sendStatus(200);
  } else {
    process.exit(1);
    ctx.response.sendStatus(401);
  }
}

let loginPost = passport.authenticate("local", {
  successRedirect: "/logged",
  failureRedirect: "/loginError",
});

async function registerPost(ctx) {
  const bd = new contenedorMongoose(User);
  let coll = await bd.read().then();

  const newUsuario = coll.find(
    (usuario) => usuario.username == ctx.request.body.username
  );
  if (newUsuario) {
    ctx.response.render("registerError");
  } else {
    let newUser = {};
    newUser.username = ctx.request.body.username;
    newUser.email = ctx.request.body.email;
    newUser.password = await createHash(ctx.request.body.password);
    newUser.number = ctx.request.body.number;
    bd.create(ctx.request.body);
    ctx.response.redirect("/login");
  }

  const MailAdmin = "...";

  const transporter = createTransport({
    service: "gmail",
    port: 587,
    auth: {
      user: MailAdmin,
      pass: "",
    },
  });

  const mailOptions = {
    from: "Servidor Node.js",
    to: ctx.request.body.email,
    subject: "Nuevo usuario",
    html: [
      ctx.request.doby.username,
      ctx.request.body.email,
      ctx.request.body.number,
    ],
    attachments: [
      {
        path: "58F.jpg",
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(info);
  } catch (error) {
    console.log(error);
  }
  const accountSid = "AC1fa832d3b34023d1f65e7b29b1ec0651";
  const authToken = "0e42fe04ac8d86727f1ebe330d977ab7";
  const client = require("twilio")(accountSid, authToken);

  client.messages
    .create({
      body: [
        ctx.request.body.username,
        ctx.request.body.email,
        ctx.request.body.number,
      ],
      from: "whatsapp:+14155238886",
      to: "whatsapp:+5493517883201",
    })
    .then((message) => console.log(message.sid))
    .done();

  const options = {
    body: [
      ctx.request.body.username,
      ctx.request.body.email,
      ctx.request.body.number,
    ],
    mediaUrl: [],
    from: "whatsapp:+14155238886",
    to: "whatsapp:+5493517883201",
  };
}

module.exports = {
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
  //   loginPost,
  registerPost,
};
export default loginPost;
