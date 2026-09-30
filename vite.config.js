import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const page = (p) => fileURLToPath(new URL(p, import.meta.url));

// Web estática multipágina: cada HTML se compila a dist/ con la misma ruta.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: page("./index.html"),
        avisoLegal: page("./legal/aviso-legal.html"),
        privacidad: page("./legal/privacidad.html"),
        cookies: page("./legal/cookies.html"),
        notFound: page("./404.html"),
      },
    },
  },
});
