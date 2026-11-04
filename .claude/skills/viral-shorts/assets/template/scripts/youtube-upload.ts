/**
 * Upload e agendamento de Shorts pela YouTube Data API v3.
 *
 *   npm run youtube -- auth
 *       Abre o login do Google uma vez e salva o token em .secrets/youtube-token.json.
 *
 *   npm run youtube -- upload <slug> [--dry-run] [--confirmar]
 *       Sobe out/<slug>/video.mp4 com os dados de src/videos/<slug>/metadata.json.
 *       Sem --confirmar só mostra o que seria enviado (nada sobe).
 *
 *   npm run youtube -- fila add <slug> [<slug>...] --inicio 2026-11-10T12:00:00-03:00 [--intervalo-horas 24]
 *       Coloca vídeos na fila com datas de publicação espaçadas (out/upload-queue.json).
 *   npm run youtube -- fila ver
 *   npm run youtube -- fila run [--max 10] [--dry-run] [--confirmar]
 *       Sobe os pendentes em ordem; se a cota diária acabar, para e retoma na próxima execução.
 *
 * .env: YT_CLIENT_SECRET (JSON do OAuth "App para computador"), YT_TOKEN_PATH, YT_CATEGORY_ID
 * Atenção: projetos de API NÃO auditados pelo YouTube têm todo upload travado como PRIVADO.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { parseArgs } from "node:util";
import { google, type youtube_v3 } from "googleapis";
import { formatIssues, validateMetadata, youtubeDescription, type Metadata } from "./lib/metadata.ts";
import { fail, outDir, readJson, ROOT, videoDir, writeJson } from "./lib/project.ts";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];
const secretPath = path.resolve(process.env.YT_CLIENT_SECRET ?? ".secrets/client_secret.json");
const tokenPath = path.resolve(process.env.YT_TOKEN_PATH ?? ".secrets/youtube-token.json");
const queuePath = path.join(ROOT, "out", "upload-queue.json");
const TZ = process.env.YT_TIMEZONE ?? "America/Sao_Paulo";
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" }) + ` (${TZ})`;

type QueueItem = {
  slug: string;
  publicarEm: string | null;
  status: "pendente" | "enviado" | "erro";
  videoId?: string;
  erro?: string;
  enviadoEm?: string;
};

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    "dry-run": { type: "boolean", default: false },
    confirmar: { type: "boolean", default: false },
    inicio: { type: "string" },
    "intervalo-horas": { type: "string", default: "24" },
    max: { type: "string", default: "50" },
  },
});

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

const makeClient = (redirectUri?: string) => {
  if (!fs.existsSync(secretPath)) {
    fail(
      `Não achei o client secret em ${secretPath}.\n` +
        "Google Cloud Console → APIs e serviços → Credenciais → Criar ID do cliente OAuth → \"App para computador\" → baixar JSON.\n" +
        "Veja references/upload-youtube.md da skill.",
    );
  }
  const json = readJson<{ installed?: { client_id: string; client_secret: string }; web?: { client_id: string; client_secret: string } }>(secretPath);
  const c = json.installed ?? json.web;
  if (!c) fail("client_secret.json inválido (esperava a chave \"installed\").");
  return new google.auth.OAuth2(c!.client_id, c!.client_secret, redirectUri);
};

const openUrl = (url: string) => {
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  try {
    spawn(cmd, args, { stdio: "ignore", detached: true }).on("error", () => {}).unref();
  } catch {
    /* o link também é impresso no terminal */
  }
};

const auth = async () => {
  const server = http.createServer();
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const port = (server.address() as { port: number }).port;
  const client = makeClient(`http://127.0.0.1:${port}`);
  const url = client.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: SCOPES });
  console.log(`\nAbra este link, entre na conta do canal e autorize:\n\n${url}\n`);
  openUrl(url);
  const code = await new Promise<string>((resolve, reject) => {
    server.on("request", (req, res) => {
      const u = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
      const c = u.searchParams.get("code");
      const err = u.searchParams.get("error");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(c ? "<h2>Pronto! Pode fechar esta aba e voltar ao terminal.</h2>" : `<h2>Erro: ${err}</h2>`);
      if (c) resolve(c);
      else if (err) reject(new Error(err));
    });
  });
  server.close();
  const { tokens } = await client.getToken(code);
  writeJson(tokenPath, tokens);
  client.setCredentials(tokens);
  const yt = google.youtube({ version: "v3", auth: client });
  const me = await yt.channels.list({ part: ["snippet"], mine: true });
  const canal = me.data.items?.[0]?.snippet?.title ?? "(sem canal)";
  console.log(`✔ Autorizado no canal "${canal}". Token salvo em ${path.relative(ROOT, tokenPath)}`);
};

const authorizedClient = () => {
  if (!fs.existsSync(tokenPath)) fail("Sem token. Rode primeiro: npm run youtube -- auth");
  const client = makeClient();
  client.setCredentials(readJson(tokenPath));
  client.on("tokens", (t) => writeJson(tokenPath, { ...readJson<object>(tokenPath), ...t }));
  return client;
};

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

const loadMetadata = (slug: string): Metadata => {
  const { data, issues } = validateMetadata(readJson(path.join(videoDir(slug), "metadata.json")));
  if (!data || issues.some((i) => i.level === "erro")) {
    console.log(formatIssues(issues));
    fail(`metadata.json de ${slug} tem erros.`);
  }
  return data!;
};

export const buildRequestBody = (m: Metadata, publicarEm: string | null): youtube_v3.Schema$Video => {
  const publishAt = publicarEm ?? m.youtube.publicarEm;
  return {
    snippet: {
      title: m.youtube.titulo,
      description: youtubeDescription(m),
      tags: m.youtube.tags,
      categoryId: m.youtube.categoria || process.env.YT_CATEGORY_ID || "27",
      defaultLanguage: "pt-BR",
      defaultAudioLanguage: "pt-BR",
    },
    status: {
      // Agendamento exige "private" + publishAt; o YouTube publica sozinho na data.
      privacyStatus: publishAt ? "private" : m.youtube.privacidade,
      publishAt: publishAt ? new Date(publishAt).toISOString() : undefined,
      selfDeclaredMadeForKids: false,
      containsSyntheticMedia: m.youtube.midiaSintetica,
      embeddable: true,
    },
  };
};

class QuotaError extends Error {}

const uploadOne = async (slug: string, publicarEm: string | null): Promise<string | null> => {
  const m = loadMetadata(slug);
  const file = path.join(outDir(slug), "video.mp4");
  if (!fs.existsSync(file)) fail(`Não achei ${file}. Rode npm run render e npm run finalize.`);
  const body = buildRequestBody(m, publicarEm);
  const mb = (fs.statSync(file).size / 1e6).toFixed(1);

  console.log(`\n── ${slug} (${mb} MB)`);
  console.log(`   título: ${body.snippet!.title}`);
  console.log(`   publicação: ${body.status!.publishAt ? fmtDate(body.status!.publishAt) : body.status!.privacyStatus}`);
  if (values["dry-run"] || !values.confirmar) {
    console.log(JSON.stringify(body, null, 2));
    console.log(values["dry-run"] ? "ℹ --dry-run: nada foi enviado." : "ℹ Nada enviado. Revise e rode de novo com --confirmar.");
    return null;
  }

  const yt = google.youtube({ version: "v3", auth: authorizedClient() });
  try {
    const res = await yt.videos.insert(
      { part: ["snippet", "status"], notifySubscribers: true, requestBody: body, media: { body: fs.createReadStream(file) } },
      {
        onUploadProgress: (e: { bytesRead: number }) => {
          process.stdout.write(`\r   enviando ${((e.bytesRead / fs.statSync(file).size) * 100).toFixed(0)}%   `);
        },
      },
    );
    const id = res.data.id!;
    console.log(`\n✔ https://youtube.com/shorts/${id} (status: ${res.data.status?.privacyStatus})`);
    writeJson(path.join(outDir(slug), "youtube-upload.json"), {
      videoId: id,
      url: `https://youtube.com/shorts/${id}`,
      publishAt: body.status!.publishAt ?? null,
      enviadoEm: new Date().toISOString(),
    });
    if (res.data.status?.privacyStatus === "private" && !body.status!.publishAt && m.youtube.privacidade !== "private") {
      console.log("⚠ O YouTube deixou o vídeo PRIVADO. Projetos de API sem auditoria travam todo upload como privado (veja references/upload-youtube.md).");
    }
    return id;
  } catch (e: unknown) {
    const err = e as { errors?: { reason?: string }[]; message?: string };
    const reason = err.errors?.[0]?.reason ?? "";
    if (["quotaExceeded", "uploadLimitExceeded", "rateLimitExceeded"].includes(reason)) {
      throw new QuotaError(reason);
    }
    throw e;
  }
};

// ---------------------------------------------------------------------------
// Fila
// ---------------------------------------------------------------------------

const loadQueue = (): QueueItem[] => (fs.existsSync(queuePath) ? readJson<QueueItem[]>(queuePath) : []);

const queueAdd = (slugs: string[]) => {
  if (slugs.length === 0) fail("Informe os slugs: npm run youtube -- fila add a b c --inicio <data ISO>");
  const q = loadQueue();
  const stepMs = parseFloat(values["intervalo-horas"]!) * 3600_000;
  const start = values.inicio ? new Date(values.inicio).getTime() : null;
  if (values.inicio && Number.isNaN(start)) fail("--inicio inválido. Ex.: 2026-11-10T12:00:00-03:00");
  slugs.forEach((slug, i) => {
    loadMetadata(slug);
    const publicarEm = start !== null ? new Date(start + i * stepMs).toISOString() : null;
    const existing = q.find((x) => x.slug === slug && x.status !== "enviado");
    if (existing) existing.publicarEm = publicarEm;
    else q.push({ slug, publicarEm, status: "pendente" });
  });
  writeJson(queuePath, q);
  queueShow();
};

const queueShow = () => {
  const q = loadQueue();
  if (q.length === 0) return console.log("Fila vazia.");
  for (const it of q) {
    const when = it.publicarEm ? fmtDate(it.publicarEm) : "imediato";
    console.log(`${it.status.padEnd(8)} ${it.slug.padEnd(32)} ${when}${it.videoId ? `  https://youtube.com/shorts/${it.videoId}` : ""}${it.erro ? `  (${it.erro})` : ""}`);
  }
};

const queueRun = async () => {
  const q = loadQueue();
  const max = parseInt(values.max!, 10);
  let done = 0;
  for (const it of q) {
    if (it.status === "enviado" || done >= max) continue;
    if (it.publicarEm && new Date(it.publicarEm).getTime() < Date.now() + 15 * 60_000) {
      it.status = "erro";
      it.erro = "data de publicação já passou; reagende com fila add";
      continue;
    }
    try {
      const id = await uploadOne(it.slug, it.publicarEm);
      if (id) {
        it.status = "enviado";
        it.videoId = id;
        it.erro = undefined;
        it.enviadoEm = new Date().toISOString();
        done++;
      }
    } catch (e) {
      if (e instanceof QuotaError) {
        console.log(`\n⚠ Cota do YouTube esgotada (${e.message}). Rode "npm run youtube -- fila run --confirmar" amanhã para continuar.`);
        break;
      }
      it.status = "erro";
      it.erro = (e as Error).message?.slice(0, 200);
      console.log(`\n✖ ${it.slug}: ${it.erro}`);
    }
    writeJson(queuePath, q);
  }
  writeJson(queuePath, q);
  queueShow();
};

// ---------------------------------------------------------------------------

const [cmd, sub, ...rest] = positionals;
if (cmd === "auth") await auth();
else if (cmd === "upload") {
  if (!sub) fail("Uso: npm run youtube -- upload <slug> [--dry-run] [--confirmar]");
  try {
    await uploadOne(sub, null);
  } catch (e) {
    if (e instanceof QuotaError) fail(`Cota do YouTube esgotada (${e.message}). Tente amanhã.`);
    throw e;
  }
} else if (cmd === "fila" && sub === "add") queueAdd(rest);
else if (cmd === "fila" && sub === "ver") queueShow();
else if (cmd === "fila" && sub === "run") await queueRun();
else {
  console.log("Comandos: auth | upload <slug> | fila add <slugs...> --inicio <ISO> | fila ver | fila run");
  process.exit(cmd ? 1 : 0);
}
