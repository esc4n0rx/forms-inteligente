"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import lojasJson from "../lib/lojas.json";

export default function MainPage() {
  const [lojaSelecionada, setLojaSelecionada] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState("");
  const [notificationType, setNotificationType] = useState("");

  const showNotification = (message:string, type = "success") => {
    setNotification(message);
    setNotificationType(type);

    setTimeout(() => {
      setNotification("");
      setNotificationType("");
    }, 3000);
  };

  const sortedLojas = [...lojasJson.lojas].sort();

  const handleFinalizar = async () => {
    if (!lojaSelecionada || !quantidade) {
      showNotification("Por favor, selecione uma loja e insira uma quantidade.", "error");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("pedidos")
        .insert([{ loja: lojaSelecionada, quantidade: Number(quantidade) }]);

      if (error) {
        throw error;
      }

      showNotification("Pedido salvo com sucesso!", "success");
      setLojaSelecionada("");
      setQuantidade("");
    } catch (error) {
      console.error(error);
      showNotification("Erro ao salvar o pedido. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGerarEmail = async () => {
    try {
      const response = await fetch("/api/email");
  
      if (!response.ok) {
        throw new Error("Erro ao enviar email.");
      }
  
      showNotification("Email enviado com sucesso!", "success");
    } catch (error) {
      console.error(error);
      showNotification("Falha ao gerar email.", "error");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-900 text-white">
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-2">Carregamento CD</h1>
        <p className="text-sm text-gray-400 text-center mb-6">
          Selecione a loja e informe a quantidade de pallets.
        </p>

        {notification && (
          <div
            className={`mb-4 p-3 rounded ${
              notificationType === "error" ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {notification}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Loja</label>
          <select
            className="w-full p-2 bg-gray-700 text-white rounded-md"
            value={lojaSelecionada}
            onChange={(e) => setLojaSelecionada(e.target.value)}
          >
            <option value="">Selecione uma loja</option>
            {sortedLojas.map((loja, index) => (
              <option key={index} value={loja}>
                {loja}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Quantidade de Pallets</label>
          <input
            type="number"
            className="w-full p-2 bg-gray-700 text-white rounded-md"
            placeholder="Digite a quantidade"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
        </div>

        <button
          onClick={handleFinalizar}
          className={`w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Salvando..." : "Finalizar Pedido"}
        </button>

        <button
          onClick={handleGerarEmail}
          className="w-full mt-4 p-3 bg-green-600 hover:bg-green-700 rounded-md font-semibold"
        >
          Gerar Email
        </button>
      </div>
    </main>
  );
}
