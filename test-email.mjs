import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testarEmail() {
  try {
    await transporter.verify();
    console.log("✅ Conexão com SMTP bem-sucedida!");
  } catch (error) {
    console.error("❌ Erro na conexão SMTP:", error);
  }
}

testarEmail();
