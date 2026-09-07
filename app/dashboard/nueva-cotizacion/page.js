"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { jsPDF } from "jspdf";

const CATEGORIAS = ["equipo", "mano_obra", "accesorio"];

function nuevoItem() {
  return { descripcion: "", categoria: "equipo", cantidad: 1, valor_unitario: 0 };
}

export default function NuevaCotizacion() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [cliente, setCliente] = useState("");
  const [asunto, setAsunto] = useState("");
  const [condicionesPago, setCondicionesPago] = useState(
    "50% de anticipo y 50% contra la entrega final."
  );
  const [garantia, setGarantia] = useState(
    "3 meses sobre la mano de obra e instalación."
  );
  const [items, setItems] = useState([nuevoItem()]);
  const [imprevistosPct, setImprevistosPct] = useState(10);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setChecking(false);
    });
  }, [router]);

  function actualizarItem(i, campo, valor) {
    const copia = [...items];
    copia[i] = { ...copia[i], [campo]: valor };
    setItems(copia);
  }

  function agregarItem() {
    setItems([...items, nuevoItem()]);
  }

  function quitarItem(i) {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== i));
  }

  const subtotal = items.reduce(
    (acc, it) => acc + (Number(it.cantidad) || 0) * (Number(it.valor_unitario) || 0),
    0
  );
  const imprevistos = Math.round((subtotal * (Number(imprevistosPct) || 0)) / 100);
  const total = subtotal + imprevistos;

  const fmt = (n) => "$ " + Number(n).toLocaleString("es-CO", { minimumFractionDigits: 2 });

  async function siguienteNumero() {
    const { data } = await supabase.from("cotizaciones").select("numero");
    let max = 0;
    (data || []).forEach((r) => {
      const m = r.numero.match(/(\d+)/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return "CTZ" + String(max + 1).padStart(5, "0");
  }

  function generarPDF(numero, fecha) {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(107, 92, 214);
    doc.text("Telcolsa", 150, 20);
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    let y = 35;
    doc.text(`Popayán, ${fecha}.`, 15, y);
    y += 7;
    doc.setFont(undefined, "bold");
    doc.text("Señores:", 15, y);
    y += 6;
    doc.text(`No. ${numero.replace("CTZ", "")}.`, 15, y);
    y += 6;
    doc.setFont(undefined, "normal");
    doc.text(cliente, 15, y);
    y += 10;
    doc.setFont(undefined, "bold");
    doc.text("ASUNTO: ", 15, y);
    doc.setFont(undefined, "normal");
    doc.text(asunto, 40, y);
    y += 10;

    doc.setFont(undefined, "bold");
    doc.setFillColor(217, 226, 243);
    doc.rect(15, y, 180, 8, "F");
    doc.text("Descripción", 17, y + 6);
    doc.text("Cant.", 105, y + 6);
    doc.text("V. Unitario", 130, y + 6);
    doc.text("V. Total", 165, y + 6);
    y += 8;
    doc.setFont(undefined, "normal");
    items.forEach((it) => {
      const totalItem = (Number(it.cantidad) || 0) * (Number(it.valor_unitario) || 0);
      const lineas = doc.splitTextToSize(it.descripcion, 85);
      doc.text(lineas, 17, y + 5);
      doc.text(String(it.cantidad), 107, y + 5);
      doc.text(fmt(it.valor_unitario), 130, y + 5);
      doc.text(fmt(totalItem), 165, y + 5);
      y += Math.max(8, lineas.length * 5);
      doc.setDrawColor(220, 220, 220);
      doc.line(15, y, 195, y);
    });

    doc.setFillColor(198, 224, 180);
    doc.rect(15, y, 180, 7, "F");
    doc.setFont(undefined, "bold");
    doc.text("SUBTOTAL", 130, y + 5);
    doc.text(fmt(subtotal), 165, y + 5);
    y += 7;
    doc.setFillColor(255, 255, 255);
    doc.setFont(undefined, "normal");
    doc.text(`Imprevistos (${imprevistosPct}%)`, 130, y + 5);
    doc.text(fmt(imprevistos), 165, y + 5);
    y += 7;
    doc.setFillColor(198, 224, 180);
    doc.rect(15, y, 180, 7, "F");
    doc.setFont(undefined, "bold");
    doc.text("TOTAL", 130, y + 5);
    doc.text(fmt(total), 165, y + 5);
    y += 15;

    doc.setFont(undefined, "bold");
    doc.text("CONDICIONES COMERCIALES", 15, y);
    y += 7;
    doc.setFont(undefined, "normal");
    doc.text("- Validez de la cotización: 15 días hábiles.", 15, y);
    y += 6;
    doc.text(`- Forma de pago: ${condicionesPago}`, 15, y, { maxWidth: 180 });
    y += 6;
    doc.text(`- Garantía: ${garantia}`, 15, y, { maxWidth: 180 });
    y += 15;

    doc.setFont(undefined, "bold");
    doc.text("Atentamente:", 15, y);
    y += 6;
    doc.setFont(undefined, "normal");
    doc.text("Santiago F. Ortega Segura", 15, y);
    y += 5;
    doc.text("Representante Legal.", 15, y);
    y += 5;
    doc.text("Teléfono: 3005042843", 15, y);
    y += 5;
    doc.text("Correo: telcolsa@gmail.com", 15, y);
    y += 5;
    doc.text("Popayán, Cauca – Colombia", 15, y);

    doc.save(`${numero}.pdf`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!cliente.trim()) {
      setError("Falta el nombre del cliente.");
      return;
    }
    if (items.some((it) => !it.descripcion.trim())) {
      setError("Todos los ítems necesitan descripción.");
      return;
    }
    setGuardando(true);
    try {
      const numero = await siguienteNumero();
      const fecha = new Date().toISOString().slice(0, 10);

      let { data: clienteExistente } = await supabase
        .from("clientes")
        .select("id")
        .ilike("nombre", cliente.trim())
        .limit(1)
        .maybeSingle();

      let clienteId = clienteExistente?.id;
      if (!clienteId) {
        const { data: nuevoCliente, error: errCli } = await supabase
          .from("clientes")
          .insert({ nombre: cliente.trim() })
          .select("id")
          .single();
        if (errCli) throw errCli;
        clienteId = nuevoCliente.id;
      }

      const { data: proyecto, error: errProy } = await supabase
        .from("proyectos")
        .insert({ cliente_id: clienteId, nombre: asunto || "Proyecto", estado: "cotizado" })
        .select("id")
        .single();
      if (errProy) throw errProy;

      const { data: cot, error: errCot } = await supabase
        .from("cotizaciones")
        .insert({
          numero,
          proyecto_id: proyecto.id,
          cliente_id: clienteId,
          asunto,
          fecha,
          subtotal,
          imprevistos,
          total,
          condiciones_pago: condicionesPago,
          garantia,
          estado: "borrador",
        })
        .select("id")
        .single();
      if (errCot) throw errCot;

      const { error: errItems } = await supabase.from("cotizacion_items").insert(
        items.map((it) => ({
          cotizacion_id: cot.id,
          descripcion: it.descripcion,
          categoria: it.categoria,
          cantidad: Number(it.cantidad) || 0,
          valor_unitario: Number(it.valor_unitario) || 0,
        }))
      );
      if (errItems) throw errItems;

      generarPDF(numero, new Date(fecha + "T00:00:00").toLocaleDateString("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }));

      setExito(numero);
    } catch (err) {
      setError(err.message || "Ocurrió un error guardando la cotización.");
    } finally {
      setGuardando(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (exito) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="mb-2 text-lg font-medium text-telpurple">
          Cotización {exito} creada
        </p>
        <p className="mb-6 text-sm text-gray-500">
          Se guardó en el portal y el PDF se descargó a tu computador.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg bg-telpurple px-4 py-2 text-sm text-white"
          >
            Volver al dashboard
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600"
          >
            Crear otra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-lg font-medium text-telpurple">Nueva cotización</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Cliente</label>
          <input
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-telpurple"
            placeholder="Nombre del cliente"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Asunto</label>
          <input
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-telpurple"
            placeholder="Cotización para instalación de..."
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm text-gray-600">Ítems</label>
            <button
              type="button"
              onClick={agregarItem}
              className="text-sm text-telpurple hover:underline"
            >
              + Agregar ítem
            </button>
          </div>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 rounded-lg border border-gray-200 p-2"
              >
                <input
                  className="col-span-5 rounded border border-gray-300 px-2 py-1 text-sm"
                  placeholder="Descripción"
                  value={it.descripcion}
                  onChange={(e) => actualizarItem(i, "descripcion", e.target.value)}
                />
                <select
                  className="col-span-2 rounded border border-gray-300 px-2 py-1 text-sm"
                  value={it.categoria}
                  onChange={(e) => actualizarItem(i, "categoria", e.target.value)}
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className="col-span-1 rounded border border-gray-300 px-2 py-1 text-sm"
                  value={it.cantidad}
                  onChange={(e) => actualizarItem(i, "cantidad", e.target.value)}
                />
                <input
                  type="number"
                  className="col-span-2 rounded border border-gray-300 px-2 py-1 text-sm"
                  value={it.valor_unitario}
                  onChange={(e) => actualizarItem(i, "valor_unitario", e.target.value)}
                />
                <div className="col-span-1 flex items-center justify-end text-sm text-gray-600">
                  {fmt((Number(it.cantidad) || 0) * (Number(it.valor_unitario) || 0))}
                </div>
                <button
                  type="button"
                  onClick={() => quitarItem(i)}
                  className="col-span-1 text-sm text-red-500 hover:underline"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-gray-600">
              Forma de pago
            </label>
            <input
              value={condicionesPago}
              onChange={(e) => setCondicionesPago(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Garantía</label>
            <input
              value={garantia}
              onChange={(e) => setGarantia(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Imprevistos (%)</label>
          <input
            type="number"
            value={imprevistosPct}
            onChange={(e) => setImprevistosPct(e.target.value)}
            className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm"
          />
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Imprevistos</span>
            <span>{fmt(imprevistos)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-gray-100 pt-1 text-base font-medium">
            <span>Total</span>
            <span>{fmt(total)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="w-full rounded-lg bg-telpurple py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar y generar PDF"}
        </button>
      </form>
    </div>
  );
}
