import express from "express";
import cors from "cors";
import { MercadoPagoConfig, Preference } from "mercadopago";
import "dotenv/config"; // Carga las variables de entorno

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN, // Asegúrate de definir esta variable en Vercel
});

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor activo 🚀");
});

app.post("/create_preference", async (req, res) => {
  try {
    const { items, captcha } = req.body;

    if (!captcha) {
      return res.status(400).json({ error: "⚠️ Captcha es requerido" });
    }

    const captchaVerifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captcha}`;

    const captchaResponse = await fetch(captchaVerifyURL, { method: "POST" });
    const captchaData = await captchaResponse.json();

    if (!captchaData.success) {
      return res.status(400).json({ error: "❌ Error en reCAPTCHA" });
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
          success: "https://tienda-jbdaccesorios.vercel.app//success",
          failure: "https://tienda-jbdaccesorios.vercel.app//failure",
          pending: "https://tienda-jbdaccesorios.vercel.app//pending",
        },
        auto_return: "approved",
      },
    });

    console.log("✅ Preferencia creada con éxito:", result.body);

    res.json({ id: result.body.id });
  } catch (error) {
    console.error("❌ Error al crear la preferencia:", error);
    res.status(500).json({ error: "Error al procesar la compra 😢" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});

export default app; // Necesario para que Vercel lo reconozca
