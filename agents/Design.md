# Diseño Visual y de Interfaz
1. Paleta de Colores: Usa principalmente azul (#2563eb) para enlaces, botones y elementos activos. El fondo principal debe ser blanco (#ffffff) y el texto negro (#000000). Usa grises claros (#f3f4f6) para fondos de sección.
2. Tipografía: Usa la fuente por defecto de Tailwind (sans-serif). Asegúrate de que los títulos sean grandes y legibles.
3. Espaciado y Responsividad:
- Mobile-first: Los diseños deben verse perfectos en móviles primero.
- Usa `p-4` o `p-6` en secciones y `m-4` o `m-6` en componentes para espaciado consistente.
- En mobile, los contenedores de contenido deben tener `w-full` o `max-w-4xl`.
4. Componentes:
- Botones: Deben tener un color azul de fondo (`bg-blue-600`), texto blanco (`text-white`), padding generoso (`px-6 py-2`) y un estado hover que oscurezca el color (`hover:bg-blue-700`).
- Tarjetas: Para mostrar destinos, usa `bg-white`, `shadow-lg`, `rounded-xl`, y `overflow-hidden`.
5. Imágenes: Asegúrate de que las imágenes se adapten a los contenedores (`w-full`, `h-48`, `object-cover`) y que tengan transiciones suaves al pasar el mouse (`hover:scale-105`).
6. Los modales deben verse perfectos en móviles y escritorios, deben contener la información necesaria para mostrar un detalle de un destino y un formulario para reservar.