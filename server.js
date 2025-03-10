import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { MercadoPagoConfig, Preference } from "mercadopago";
import "dotenv/config"; // 🔥 Importa dotenv para leer el archivo .env

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN, // 🔥 Ahora usa la variable de entorno
});

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Soy el server :)");
});

app.post("/create_preference", async (req, res) => {
  try {
    const { items, captcha } = req.body;

    if (!captcha) {
      return res.status(400).json({ error: "Captcha es requerido" });
    }

    const captchaVerifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captcha}`;

    const captchaResponse = await fetch(captchaVerifyURL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const captchaData = await captchaResponse.json();

    if (!captchaData.success) {
      return res.status(400).json({ error: "Error en reCAPTCHA" });
    }

    const preference = new Preference(mercadopago);
    const result = await preference.create({
      body: {
        items: items.map((item) => ({
          title: item.title,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          currency_id: "ARS",
        })),
        back_urls: {
          success: "https://tu-sitio.com/success",
          failure: "https://tu-sitio.com/failure",
          pending: "https://tu-sitio.com/pending",
        },
        auto_return: "approved",
      },
    });

    console.log("Preferencia creada con éxito:", result.body);

    res.json({ id: result.body.id });
  } catch (error) {
    console.error("Error detallado:", error);
    res.status(500).json({ error: "Error al crear la preferencia :(" });
  }
});

app.listen(port, () => {
  console.log(`El servidor está corriendo en el puerto ${port}`);
});
