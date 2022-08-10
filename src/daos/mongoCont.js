const mongoose = require("mongoose");
const { user } = require("./models/user");

CRUD();

async function CRUD() {
  try {
    mongoose.connect(
      "mongodb+srv://ferru:ferru2647@cluster0.lpvnv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Conectado a MongoDB");
  } catch (err) {
    console.log(err);
  }
}

class contenedorMongoose {
  constructor(ruta) {
    this.ruta = ruta;
  }

  async create(newProd) {
    const productoNuevo = new this.ruta(newProd);
    const productos = await this.ruta.find();
    productoNuevo.id = productos.length + 1;
    await productoNuevo.save();
    console.log(productoNuevo);
  }

  async read() {
    const productos = await this.ruta.find();
    return productos;
  }

  async update(query, change) {
    const que = {};
    que._id = query;
    const productoUpdate = await this.ruta.findOneAndUpdate(que, change);
    console.log(productoUpdate);
  }

  async delete(query) {
    console.log(this.ruta);
    const que = {};
    que._id = query;
    const productoDelete = await this.ruta.deleteOne(que);
    console.log(productoDelete);
  }
}

const lista = [
  { title: "prod1", price: 50, stock: 20 },
  { title: "prod2", price: 30, stock: 15 },
  { title: "prod3", price: 20, stock: 10 },
];

// Factory

class producto {
  #id;
  #name;
  #price;
  constructor(id, name, price) {
    this.id = id;
    this.name = name;
    this.type = "producto";
    this.price = price;
  }
  get id() {
    return this.#id;
  }
  set id(id) {
    if (!id) throw new Error("El id es obligatorio");
    this.#id = id;
  }

  get name() {
    return this.#name;
  }
  set name(name) {
    if (!name) throw new Error("El nombre es obligatorio");
    this.#name = name;
  }

  get price() {
    return this.#price;
  }
  set price(price) {
    if (!price) throw new Error("El precio es obligatorio");
    if (isNaN(precio)) throw new Error("El precio debe ser numérico");
    if (precio < 0) throw new Error("El precio debe ser un valor positivo");
    this.#precio = precio;
  }
}

class usuario {
  #id;
  #name;
  #mail;
  #phone;
  constructor(id, name, mail, phone) {
    this.id = id;
    this.name = name;
    this.type = "usuario";
    this.mail = mail;
    this.phone = phone;
  }
  get id() {
    return this.#id;
  }
  set id(id) {
    if (!id) throw new Error("El id es obligatorio");
    this.#id = id;
  }

  get name() {
    return this.#name;
  }
  set name(name) {
    if (!name) throw new Error("El nombre es obligatorio");
    this.#name = name;
  }

  get mail() {
    return this.#mail;
  }
  set mail(mail) {
    if (!mail) throw new Error("El mail es obligatorio");
    this.#mail = mail;
  }

  get phone() {
    return this.#phone;
  }
  set phone(phone) {
    if (!phone) throw new Error("El número de telefono es obligatorio");
    if (isNaN(phone))
      throw new Error("El número de telefono debe ser numérico");
    this.#phone = phone;
  }
}

class TypeFactory {
  create(name, type) {
    switch (type) {
      case 1:
        return new producto(name);
        break;
      case 2:
        return new usuario(name);
    }
  }
}

const typeFactory = new TypeFactory();

let instance = null;
class SingletonC {
  constructor(name, type) {
    this.value = typeFactory.create(name, type);
  }

  static getInstance() {
    if (!instance) {
      instance = new SingletonC();
    }
    return instance;
  }
}
module.exports = { contenedorMongoose, SingletonC };
