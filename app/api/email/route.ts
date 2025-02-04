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

    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select("*");

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

    const worksheet = XLSX.utils.json_to_sheet(pedidos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");

    const planilhaBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

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

    await transporter.verify();

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "Email enviado com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao gerar e enviar email:", error);
    return NextResponse.json({ error: "Erro ao enviar email" }, { status: 500 });
  }
}
