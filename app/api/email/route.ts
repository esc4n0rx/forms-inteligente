import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";
import * as XLSX from "xlsx";
import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function GET() {
  try {
    console.log("📌 Iniciando processo de envio de email...");

    // Conferindo variáveis de ambiente
    console.log("🔑 URL do Supabase:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(
      "🔑 CHAVE ANÔNIMA:",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "OK" : "NÃO DEFINIDA"
    );
    console.log("📧 Usuário do email:", process.env.EMAIL_USER);
    console.log("🔐 Senha do email está definida?", !!process.env.EMAIL_PASS);

    // 1️⃣ Buscar registros do Supabase
    console.log("🔍 Buscando pedidos no Supabase...");
    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select("*");

    if (error) {
      console.error("❌ Erro ao buscar pedidos:", error);
      throw new Error("Erro ao buscar pedidos do banco de dados.");
    }

    console.log("✅ Pedidos recebidos:", pedidos);

    if (!pedidos || pedidos.length === 0) {
      console.warn("⚠️ Nenhum pedido encontrado no banco.");
      return NextResponse.json(
        { error: "Nenhum pedido encontrado." },
        { status: 404 }
      );
    }

    console.log(`✅ ${pedidos.length} pedidos encontrados.`);

    // 2️⃣ Criar planilha
    console.log("📄 Gerando planilha...");
    const worksheet = XLSX.utils.json_to_sheet(pedidos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");

    console.log("📝 Convertendo planilha para buffer...");
    const planilhaBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    console.log("✅ Planilha gerada com sucesso.");

    // 3️⃣ Configuração do Email
    console.log("✉️ Preparando email para envio...");
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "herrison.lima@hortifruti.com.br",
      cc: "paulo.cunha@hortifruti.com.br",
      subject: "Relatório de Carregamento - Loja",
      text: "Segue em anexo a planilha com o carregamento.",
      attachments: [
        {
          filename: "pedidos.xlsx",
          content: planilhaBuffer,
          encoding: "base64",
        },
      ],
    };

    console.log("📡 Testando conexão com SMTP...");
    await transporter.verify();
    console.log("✅ Conexão com SMTP verificada.");

    // 4️⃣ Enviar email
    console.log("📨 Enviando email...");
    await transporter.sendMail(mailOptions);
    console.log("✅ Email enviado com sucesso!");

    return NextResponse.json({ message: "Email enviado com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao gerar e enviar email:", error);
    return NextResponse.json({ error: "Erro ao enviar email" }, { status: 500 });
  }
}
