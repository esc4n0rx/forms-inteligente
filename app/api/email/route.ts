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
    console.log("📡 Buscando pedidos no banco...");

    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select("loja, quantidade");

    if (error) {
      console.error("❌ Erro ao buscar pedidos:", error);
      throw new Error("Erro ao buscar pedidos do banco de dados.");
    }

    if (!pedidos || pedidos.length === 0) {
      console.warn("⚠️ Nenhum pedido encontrado no banco.");
      return NextResponse.json(
        { error: "Nenhum pedido encontrado." },
        { status: 404 }
      );
    }

    console.log("🔄 Processando dados...");

    // Agrupar pedidos por loja e somar quantidades
    const lojasMap = new Map();

    pedidos.forEach(({ loja, quantidade }) => {
      if (lojasMap.has(loja)) {
        lojasMap.set(loja, lojasMap.get(loja) + quantidade);
      } else {
        lojasMap.set(loja, quantidade);
      }
    });

    // Converter para array e ordenar por nome da loja
    const lojasOrdenadas = Array.from(lojasMap.entries())
      .map(([loja, quantidade]) => ({ Lojas: loja, Quantidade: quantidade }))
      .sort((a, b) => a.Lojas.localeCompare(b.Lojas));

    console.log("📊 Gerando planilha...");

    // Criar planilha
    const worksheet = XLSX.utils.json_to_sheet(lojasOrdenadas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");

    const planilhaBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    console.log("✉️ Preparando email para envio...");
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "diogo.mendes@hortifruti.com.br",
      cc: "paulo.cunha@hortifruti.com.br",
      subject: "Relatório de Carregamento - Loja",
      text: "Segue em anexo a planilha com o carregamento consolidado por loja.",
      attachments: [
        {
          filename: "relatorio_lojas.xlsx",
          content: planilhaBuffer,
          encoding: "base64",
        },
      ],
    };

    await transporter.verify();
    await transporter.sendMail(mailOptions);

    console.log("✅ Email enviado com sucesso!");

    return NextResponse.json({ message: "Email enviado com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao gerar e enviar email:", error);
    return NextResponse.json({ error: "Erro ao enviar email" }, { status: 500 });
  }
}
