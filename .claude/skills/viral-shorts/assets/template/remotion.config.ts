import { Config } from "@remotion/cli/config";

// Configuração do Remotion para Shorts verticais.
// Variáveis opcionais (coloque no .env ou no ambiente):
//   REMOTION_GL=angle|swangle|egl|vulkan  -> renderizador WebGL (3D). "angle" usa a GPU; "swangle" roda na CPU.
//   REMOTION_BROWSER_EXECUTABLE=/caminho/do/chrome-headless-shell -> usa um navegador já instalado.

Config.setEntryPoint("src/index.ts");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");

const gl = process.env.REMOTION_GL as
  | "swangle"
  | "angle"
  | "egl"
  | "swiftshader"
  | "vulkan"
  | "angle-egl"
  | undefined;
if (gl) {
  Config.setChromiumOpenGlRenderer(gl);
}

if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
