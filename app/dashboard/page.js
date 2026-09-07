"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function Dashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [cotizaciones, setCotizaciones] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalMonto, setTotalMonto] = useState(0);
  const [clientesCount, setClientesCount] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      setUserEmail(session.user.email);

      const { count: cotCount } = await supabase
        .from("cotizaciones")
        .select("*", { count: "exact", head: true });
      setTotalCount(cotCount || 0);

      const { data: sumRows } = await supabase
        .from("cotizaciones")
        .select("total");
      const suma = (sumRows || []).reduce(
        (acc, r) => acc + Number(r.total || 0),
        0
      );
      setTotalMonto(suma);

      const { count: cliCount } = await supabase
        .from("clientes")
        .select("*", { count: "exact", head: true });
      setClientesCount(cliCount || 0);

      const { data: rows } = await supabase
        .from("cotizaciones")
        .select("numero, total, estado, fecha, clientes(nombre)")
        .order("total", { ascending: false })
        .limit(30);
      setCotizaciones(rows || []);

      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const filtered = cotizaciones.filter((c) => {
    const term = search.toLowerCase();
    const cliente = c.clientes?.nombre?.toLowerCase() || "";
    return c.numero.toLowerCase().includes(term) || cliente.includes(term);
  });

  const fmt = (n) =>
    "$" + Number(n).toLocaleString("es-CO", { maximumFractionDigits: 0 });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-telpurple">
            Portal Telcolsa
          </h1>
          <p className="text-sm text-gray-500">Sesión: {userEmail}</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Cotizaciones</p>
          <p className="text-2xl font-medium">{totalCount}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Clientes</p>
          <p className="text-2xl font-medium">{clientesCount}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Monto cotizado</p>
          <p className="text-2xl font-medium">{fmt(totalMonto)}</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Buscar por cliente o número..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-telpurple"
      />

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
              <th className="px-4 py-2">Número</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.numero} className="border-b border-gray-50">
                <td className="px-4 py-2">{c.numero}</td>
                <td className="px-4 py-2">{c.clientes?.nombre || "-"}</td>
                <td className="px-4 py-2">{fmt(c.total)}</td>
                <td className="px-4 py-2">{c.estado}</td>
                <td className="px-4 py-2 text-gray-500">{c.fecha || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-400">
            Sin resultados
          </p>
        )}
      </div>
    </div>
  );
}
