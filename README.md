# Portal Telcolsa (MVP)

Portal interno con login y un dashboard que muestra las cotizaciones reales
guardadas en Supabase, respetando los permisos por rol que ya tiene la base
de datos (RLS).

## Qué hace ahora mismo

- Pantalla de login real contra Supabase Auth.
- Dashboard con: total de cotizaciones, clientes, monto acumulado, y una
  tabla buscable de las cotizaciones de mayor valor.
- Todo lo que ves lo trae en vivo desde tu proyecto de Supabase
  (`nhjrlosdltsajcawycko`).

## Cómo probarlo en tu computador (opcional)

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Abre `http://localhost:3000`, entra con `ceo@telcolsa.com` y tu contraseña.

## Cómo publicarlo en internet (recomendado)

1. Crea un repositorio nuevo en GitHub y sube esta carpeta completa.
2. Entra a vercel.com, "Add New Project", e importa ese repositorio.
3. En "Environment Variables" agrega las dos que están en
   `.env.local.example` (cópialas tal cual, ya son las reales de tu
   proyecto — la clave es la pública, es seguro tenerla ahí).
4. Dale "Deploy". En un par de minutos tienes una URL real
   (algo como `telcolsa-portal.vercel.app`) que puedes abrir desde
   cualquier celular o computador.

Nota sobre Vercel: el plan gratis (Hobby) es solo para uso personal, no
comercial. Para un portal de negocio real vas a necesitar el plan Pro
($20/mes). Es la opción más simple para empezar — más adelante, si quieres,
migramos esto a la VPS propia como hicieron con ArchiTechIA.

## Qué falta (siguientes pasos)

- Agregar técnicos y socios como usuarios con sus propios roles.
- Pantalla para crear cotizaciones nuevas directo desde el portal
  (ahora mismo se siguen generando por acá, en el chat).
- Editar precios base desde una pantalla en vez del editor de Supabase.
