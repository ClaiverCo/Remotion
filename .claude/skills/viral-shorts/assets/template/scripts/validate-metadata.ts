/**
 * Valida o metadata.json (título, descrição, hashtags) para YouTube Shorts, TikTok e Reels.
 * Uso: npm run validate -- <slug>
 * Sai com código 1 se houver erro (avisos não bloqueiam).
 */
import path from "node:path";
import { parseArgs } from "node:util";
import { formatIssues, validateMetadata } from "./lib/metadata.ts";
import { readJson, requireSlug, videoDir } from "./lib/project.ts";

const { positionals } = parseArgs({ allowPositionals: true });
const slug = requireSlug(positionals, "npm run validate -- <slug>");
const { issues } = validateMetadata(readJson(path.join(videoDir(slug), "metadata.json")));
console.log(formatIssues(issues));
if (issues.some((i) => i.level === "erro")) process.exit(1);
