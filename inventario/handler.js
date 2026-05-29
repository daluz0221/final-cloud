const { randomUUID } = require("crypto");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const express = require("express");
const serverless = require("serverless-http");

const app = express();
const TABLE = process.env.PRODUCTOS_TABLE;
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

function isValidCantidad(value) {
  return Number.isInteger(value) && value >= 0;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// GET /productos — listar todos
app.get("/productos", async (req, res) => {
  try {
    const { Items = [] } = await docClient.send(
      new ScanCommand({ TableName: TABLE })
    );
    res.status(200).json(Items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron listar los productos" });
  }
});

// POST /productos — crear
app.post("/productos", async (req, res) => {
  const { nombre, categoria, cantidad } = req.body ?? {};

  if (!isNonEmptyString(nombre)) {
    return res
      .status(400)
      .json({ error: "nombre es obligatorio y no puede estar vacío" });
  }

  if (cantidad !== undefined && !isValidCantidad(cantidad)) {
    return res.status(400).json({
      error: "cantidad debe ser un número entero mayor o igual a 0",
    });
  }

  const producto = {
    id: randomUUID(),
    nombre: nombre.trim(),
    categoria:
      categoria !== undefined && isNonEmptyString(categoria)
        ? categoria.trim()
        : "General",
    cantidad: cantidad ?? 0,
    updatedAt: new Date().toISOString(),
  };

  try {
    await docClient.send(
      new PutCommand({ TableName: TABLE, Item: producto })
    );
    res.status(201).json(producto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo crear el producto" });
  }
});

// PUT /productos/:id — actualizar
app.put("/productos/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, categoria, cantidad } = req.body ?? {};

  if (nombre !== undefined && !isNonEmptyString(nombre)) {
    return res
      .status(400)
      .json({ error: "nombre es obligatorio y no puede estar vacío" });
  }

  if (cantidad !== undefined && !isValidCantidad(cantidad)) {
    return res.status(400).json({
      error: "cantidad debe ser un número entero mayor o igual a 0",
    });
  }

  if (
    nombre === undefined &&
    categoria === undefined &&
    cantidad === undefined
  ) {
    return res.status(400).json({ error: "Debe enviar al menos un campo para actualizar" });
  }

  const updates = [];
  const names = {};
  const values = {};

  if (nombre !== undefined) {
    updates.push("#nombre = :nombre");
    names["#nombre"] = "nombre";
    values[":nombre"] = nombre.trim();
  }

  if (categoria !== undefined) {
    if (!isNonEmptyString(categoria)) {
      return res.status(400).json({ error: "categoria no puede estar vacía" });
    }
    updates.push("#categoria = :categoria");
    names["#categoria"] = "categoria";
    values[":categoria"] = categoria.trim();
  }

  if (cantidad !== undefined) {
    updates.push("#cantidad = :cantidad");
    names["#cantidad"] = "cantidad";
    values[":cantidad"] = cantidad;
  }

  updates.push("#updatedAt = :updatedAt");
  names["#updatedAt"] = "updatedAt";
  values[":updatedAt"] = new Date().toISOString();

  try {
    const { Attributes } = await docClient.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { id },
        UpdateExpression: `SET ${updates.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ConditionExpression: "attribute_exists(id)",
        ReturnValues: "ALL_NEW",
      })
    );
    res.status(200).json(Attributes);
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    console.error(error);
    res.status(500).json({ error: "No se pudo actualizar el producto" });
  }
});

// DELETE /productos/:id — eliminar
app.delete("/productos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE,
        Key: { id },
        ConditionExpression: "attribute_exists(id)",
      })
    );
    res.status(204).send();
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    console.error(error);
    res.status(500).json({ error: "No se pudo eliminar el producto" });
  }
});

// Rutas no definidas
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

exports.handler = serverless(app);