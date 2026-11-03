import path from "node:path";
import { bundle } from "@remotion/bundler";
import {
  openBrowser,
  selectComposition,
  type ChromiumOptions,
} from "@remotion/renderer";
import { loadRoteiro, ROOT } from "./project.ts";

type Gl = NonNullable<ChromiumOptions["gl"]>;

/** Escolhe o renderizador WebGL: vídeos 3D precisam de WebGL (angle na GPU, swangle na CPU). */
export const chromiumOptionsFor = (slug: string): ChromiumOptions => {
  const env = process.env.REMOTION_GL as Gl | undefined;
  const estilo = loadRoteiro(slug).estilo;
  if (env) return { gl: env };
  return estilo === "3d" ? { gl: "angle" } : {};
};

export const browserExecutable = () => process.env.REMOTION_BROWSER_EXECUTABLE || null;

let cachedServeUrl: string | null = null;
export const bundleProject = async () => {
  if (cachedServeUrl) return cachedServeUrl;
  let last = -1;
  cachedServeUrl = await bundle({
    entryPoint: path.join(ROOT, "src", "index.ts"),
    publicDir: path.join(ROOT, "public"),
    onProgress: (p) => {
      const step = Math.floor(p / 25);
      if (step !== last) {
        last = step;
        process.stdout.write(`\r→ empacotando projeto ${p}%   `);
      }
    },
  });
  process.stdout.write("\n");
  return cachedServeUrl;
};

export const prepare = async (slug: string) => {
  const serveUrl = await bundleProject();
  const chromiumOptions = chromiumOptionsFor(slug);
  const exe = browserExecutable();
  const browser = await openBrowser("chrome", {
    browserExecutable: exe,
    chromiumOptions,
  });
  const composition = await selectComposition({
    serveUrl,
    id: slug,
    puppeteerInstance: browser,
    browserExecutable: exe,
    chromiumOptions,
  });
  return { serveUrl, chromiumOptions, browser, composition, browserExecutable: exe };
};
