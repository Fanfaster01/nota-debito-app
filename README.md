cat > README.md << EOL
# Generador de Notas de Débito por Diferencial Cambiario

Aplicación web desarrollada con Next.js para generar notas de débito por diferencial cambiario en Venezuela, cumpliendo con la normativa fiscal local.

## Características

- Registro de facturas con montos exentos y gravables
- Soporte para notas de crédito
- Cálculo automático del diferencial cambiario
- Generación de notas de débito en formato PDF
- Cálculo del monto final a pagar considerando retenciones de IVA

## Tecnologías utilizadas

- Next.js 14
- TypeScript
- React Hook Form
- Zod para validación
- @react-pdf/renderer para generación de PDF
- Tailwind CSS para estilos

## Cómo ejecutar localmente

1. Clona este repositorio
2. Instala las dependencias: \`npm install\`
3. Ejecuta el servidor de desarrollo: \`npm run dev\`
4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## Despliegue

Esta aplicación está preparada para ser desplegada en Vercel.
EOL