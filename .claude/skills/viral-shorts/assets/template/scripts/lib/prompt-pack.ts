/**
 * Monta o PACOTE DE PROMPTS (Google Flow / Higgsfield) de um episódio do universo Stickman do Futuro,
 * seguindo o documento "Future Stickman Video Instructions". Funções puras: recebem o roteiro, o
 * clips.json, o dossiê e (se houver) a narração medida; devolvem o Markdown e os avisos.
 *
 * Tudo que é fixo vem de src/stickman/bible.ts. O parágrafo de identidade entra LITERALMENTE em
 * todo prompt com o personagem.
 */
import type { Roteiro } from "../../src/lib/schema.ts";
import type { VideoCaption } from "../../src/lib/types.ts";
import { tokenizeNarration } from "../../src/lib/words.ts";
import {
  ADDITIONS,
  ERAS,
  FUTURE_PEOPLE,
  identityParagraph,
  LEAD,
  NEGATIVE,
  PLANET,
  PRESENT_PEOPLE,
  SOUND,
  STYLE,
  TIME_TRAVEL,
  type CharacterBible,
} from "../../src/stickman/bible.ts";
import type { Clip, ClipsFile } from "../../src/stickman/clips.ts";

export const CLIP_SECONDS = 10;

export const REQUIRED_AGENT_OPENING =
  "You are the character and visual continuity supervisor for this future stickman video series. Apply the fixed designs below to every scene prompt and every image you are able to inspect. Preserve character identity across changes in pose, expression, camera angle, location, and era. When asked to generate or revise a scene, use its approved references as well as the written specifications.";

/**
 * Faixas do documento (imagem ~150–250, animação ~200–350 palavras) aplicadas à DIREÇÃO do clipe:
 * o prompt inteiro menos os blocos travados que entram literalmente (identidades, relíquia, estilo e
 * negativos da bíblia). Cada personagem a mais em cena ganha EXTRA_PER_CHARACTER de folga
 * ("additional space when repeating multiple character identities").
 */
export const WORD_RANGES = {
  image: [150, 250] as const,
  animation: [200, 350] as const,
  narration: [12, 26] as const,
};

export const EXTRA_PER_CHARACTER = 60;

export type VoiceClip = { file: string; durationMs: number };

export type PackInput = {
  roteiro: Roteiro;
  clips: ClipsFile;
  /** conteúdo do pesquisa.md */
  pesquisa: string;
  /** legendas com tempo (da narração gerada) para medir cada clipe */
  captions?: VideoCaption[] | null;
  /** arquivos de voz por clipe já cortados (C01_voice.mp3…) */
  voice?: (VoiceClip | null)[] | null;
  /** nome do PNG da folha de personagem do Kip, se foi gerado (ex.: "FL-01_character-sheet.png") */
  leadSheetFile?: string | null;
};

export type ClipPrompts = {
  code: string;
  image: string;
  animation: string;
  imageWords: number;
  animationWords: number;
  /** palavras sem os blocos travados (identidades, relíquia, estilo, negativos) */
  imageDirectionWords: number;
  animationDirectionWords: number;
  narrationWords: number;
  measuredMs: number | null;
  /** personagens no quadro inicial / no clipe inteiro (para a folga das faixas) */
  imageCharacters: number;
  animationCharacters: number;
};

export type PackOutput = { markdown: string; clips: ClipPrompts[]; warnings: string[] };

export const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
export const clipCode = (i: number) => `C${String(i + 1).padStart(2, "0")}`;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export const clipRange = (i: number) => `${mmss(i * CLIP_SECONDS)}–${mmss((i + 1) * CLIP_SECONDS)}`;
const plain = (narracao: string) => narracao.replace(/\*/g, "").trim();

type EraKey = "futuro" | "presente" | "viagem" | "comparacao";

const eraInfo = (era: EraKey) => {
  const fut = ERAS.future;
  const pre = ERAS.present;
  const futureNeg = "no present-day objects except the relic";
  const presentNeg = "no futuristic scenery or tech except Kip's own gear";
  const noRealPeople = "no real or identifiable people";
  const futPal = `cool off-white ${fut.background}, accents ${fut.accents.join(" and ")}`;
  const prePal = `warm off-white ${pre.background}, muted accents ${pre.accents.join(" and ")}`;
  switch (era) {
    case "futuro":
      return {
        label: "Future",
        name: `Future, planet ${PLANET.name} (fiction)`,
        scenery: PLANET.look,
        palette: futPal,
        negatives: [futureNeg],
        sound: SOUND.future,
      };
    case "presente":
      return {
        label: "Present day",
        name: "Present day (the old days, 2020s)",
        scenery: pre.scenery,
        palette: prePal,
        negatives: [presentNeg, noRealPeople],
        sound: SOUND.present,
      };
    case "viagem":
      return {
        label: "Future to present day",
        name: `Time jump: future (planet ${PLANET.name}, fiction) to the present day (2020s)`,
        scenery: `starts in the future (${PLANET.look}); ends in a simple present-day place`,
        palette: `starts ${futPal}; ends ${prePal}`,
        negatives: ["time travel ONLY by the Chrono-Band ring portal", `${futureNeg} before the jump`, `${presentNeg} after it`],
        sound: `${SOUND.travel}; the future bed crossfades into the present bed`,
      };
    case "comparacao":
      return {
        label: "Present day and future",
        name: "Split comparison: present day (top half) and future (bottom half)",
        scenery: `top: ${pre.scenery}; bottom: ${PLANET.look}`,
        palette: `top ${prePal}; bottom ${futPal}`,
        negatives: ["each half stays era-pure (only the relic and Kip's gear cross)", noRealPeople],
        sound: `a soft swap between the present bed (${SOUND.present}) and the future bed (${SOUND.future})`,
      };
  }
};

/** Identidade de quem aparece no clipe: Kip, elenco do episódio ou figurantes genéricos. */
const identityFor = (id: string, cast: ClipsFile["cast"], era: EraKey): { label: string; text: string } => {
  if (id === LEAD.id) return { label: `${LEAD.name} (${LEAD.id})`, text: identityParagraph(LEAD) };
  const member = cast.find((c) => c.id === id);
  if (member) return { label: `${member.name} (${member.id})`, text: identityParagraph(member as CharacterBible) };
  if (id === "crowd") {
    return era === "futuro"
      ? { label: "Background citizens", text: FUTURE_PEOPLE.rule }
      : { label: "Background people", text: PRESENT_PEOPLE.rule };
  }
  throw new Error(`clips.json: personagem "${id}" não existe (use ${LEAD.id}, um id de "cast" ou "crowd").`);
};

const mentionsRelic = (clip: Clip, relicName: string) => {
  const hay = [
    clip.opening,
    ...clip.beats,
    clip.finalState,
    clip.layout.foreground,
    clip.layout.middleground,
    clip.layout.background,
    ...clip.characters.map((c) => c.holding),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes("relic") || hay.includes(relicName.toLowerCase());
};

const negativesFor = (clip: Clip, era: ReturnType<typeof eraInfo>) => [...NEGATIVE, ...era.negatives, ...clip.avoid];

/** Monta os dois prompts do clipe e conta as palavras úteis. */
export const buildClipPrompts = (roteiro: Roteiro, file: ClipsFile, i: number, measuredMs: number | null): ClipPrompts => {
  const clip = file.clips[i];
  const cena = roteiro.cenas[i];
  const code = clipCode(i);
  const relic = roteiro.reliquia!;
  const era = eraInfo(cena.era as EraKey);
  const ids = clip.characters.map((c) => identityFor(c.id, file.cast, cena.era as EraKey));
  const startIdx = clip.characters.flatMap((c, k) => (c.inStartFrame ? [k] : []));
  const showRelic = mentionsRelic(clip, relic.nome);
  const relicText = file.relicDescription;
  const lockedCommon = [STYLE, NEGATIVE.join("; "), ...(showRelic ? [relicText] : [])];
  const block = (ks: number[]) => ks.map((k) => (clip.characters[k].id === "crowd" ? `${ids[k].label}: ${ids[k].text}` : ids[k].text)).join("\n");
  const relicBlock = showRelic ? `\nRelic (${relic.nome}): ${relicText}` : "";
  const placement = startIdx
    .map((k) => {
      const c = clip.characters[k];
      const costume = /^default design/i.test(c.costume) ? "" : `; costume ${c.costume}`;
      return `${ids[k].label} now: ${c.position}; facing ${c.facing}; ${c.pose}; ${c.expression}; holding ${c.holding}${costume}.`;
    })
    .join("\n");
  const all = clip.characters.map((_, k) => k);
  const negatives = negativesFor(clip, era).join("; ");

  const image = [
    `Vertical 9:16 still image, the START frame of clip ${code} of a 2D stickman short: one single moment, before the main action.`,
    `Locked style: ${STYLE}.`,
    `Era and place: ${era.name}; ${clip.location}; ${clip.timeOfDay}.`,
    `Framing: ${clip.framing}.`,
    `Foreground: ${clip.layout.foreground}. Middle ground: ${clip.layout.middleground}. Background: ${clip.layout.background}.`,
    block(startIdx) + relicBlock,
    placement,
    `Opening setup: ${clip.opening}`,
    `Palette: outlines ${LEAD.colors.outline}, thicker than scenery lines; ${era.palette}; flat fills.`,
    "Keep the bottom fifth calm for captions added in the editor.",
    `Avoid: ${negatives}.`,
  ].join("\n");

  const entering = clip.characters
    .filter((c) => !c.inStartFrame)
    .map((c) => `${ids[clip.characters.indexOf(c)].label} enters during the clip (${c.position}; facing ${c.facing}; ${c.expression})`);
  const motion =
    clip.motionLimits ??
    "one dominant action; readable stickman motion with anticipation, action and reaction; feet stay on the ground unless a beat says otherwise; no morphing, no camera shake";
  const animation = [
    `Animate the attached scene image as the STARTING FRAME of clip ${code}; keep its composition, characters and colors. 10-second editorial clip, vertical 9:16.`,
    `Locked style: ${STYLE}.`,
    block(all) + relicBlock,
    `Place: ${era.name}; ${clip.location}.`,
    `Opening state: ${clip.opening}${entering.length ? ` ${entering.join("; ")}.` : ""}`,
    "Timing (directing targets):",
    `0.0–2.0 s: ${clip.beats[0]}`,
    `2.0–5.0 s: ${clip.beats[1]}`,
    `5.0–8.0 s: ${clip.beats[2]}`,
    `8.0–10.0 s: ${clip.beats[3]}`,
    `Camera: ${clip.camera}.`,
    `Motion limits: ${motion}.`,
    "Props keep their hand, size and colors unless a beat moves them; never duplicate a prop.",
    `Final state at 10.0 s: ${clip.finalState}`,
    `Transition: ${clip.transition}.`,
    "No speech, lip sync or on-screen text; narration and captions are added in the editor.",
    `Avoid: ${negatives}.`,
  ].join("\n");

  const lockedWords = (ks: number[]) => [...ks.map((k) => ids[k].text), ...lockedCommon].reduce((a, x) => a + countWords(x), 0);
  const narrationWords = tokenizeNarration(cena.narracao).length;
  return {
    code,
    image,
    animation,
    imageWords: countWords(image),
    animationWords: countWords(animation),
    imageDirectionWords: countWords(image) - lockedWords(startIdx),
    animationDirectionWords: countWords(animation) - lockedWords(all),
    narrationWords,
    measuredMs,
    imageCharacters: startIdx.length,
    animationCharacters: all.length,
  };
};

/** Duração falada de cada cena (primeira palavra → última), em ms. */
export const measureScenes = (captions: VideoCaption[] | null | undefined, n: number): (number | null)[] =>
  Array.from({ length: n }, (_, i) => {
    const w = (captions ?? []).filter((c) => c.scene === i);
    if (!w.length) return null;
    return w[w.length - 1].endMs - w[0].startMs;
  });

export const PLACEHOLDER_RE = /\b(TODO|TBD|FIXME|lorem ipsum)\b|\{\{|\}\}|same as before|continue similarly|use the previous style/i;

const fence = (s: string) => "```text\n" + s + "\n```";
const demote = (md: string) => md.replace(/^(#{1,4}) /gm, (_m, h: string) => `${h}## `);

export const validateInputs = (roteiro: Roteiro, file: ClipsFile): string[] => {
  const errs: string[] = [];
  if (!roteiro.reliquia) errs.push('roteiro.json: falta "reliquia" { nome, descricao }.');
  if (file.clips.length !== roteiro.cenas.length) {
    errs.push(`clips.json tem ${file.clips.length} clipes, mas o roteiro tem ${roteiro.cenas.length} cenas.`);
  }
  roteiro.cenas.forEach((c, i) => {
    if (!c.era) errs.push(`roteiro.json: a cena "${c.id}" não tem "era".`);
    const clip = file.clips[i];
    if (clip && clip.cena !== c.id) errs.push(`clips.json: o clipe ${i + 1} é "${clip.cena}", mas a cena ${i + 1} do roteiro é "${c.id}".`);
  });
  const ids = new Set([LEAD.id, "crowd", ...file.cast.map((c) => c.id)]);
  file.clips.forEach((clip, i) =>
    clip.characters.forEach((p) => {
      if (!ids.has(p.id)) errs.push(`clips.json: clipe ${i + 1} usa o personagem "${p.id}", que não existe.`);
    }),
  );
  if (!file.clips.every((c) => c.characters.some((p) => p.id === LEAD.id))) {
    errs.push(`clips.json: o ${LEAD.name} (${LEAD.id}) precisa aparecer em todos os clipes.`);
  }
  return errs;
};

const referenceSheetPrompt = (c: CharacterBible) => {
  const extras = [
    `a close-up panel of the identity-defining headwear or hair (${c.hairOrHeadwear})`,
    /^none/i.test(c.signatureProp) ? null : `a separate panel of the signature prop (${c.signatureProp})`,
  ].filter(Boolean);
  return [
    "Create a clean character reference sheet of ONE character on a plain light background (#FFFFFF), 16:9, consistent scale, ample spacing between clearly separated panels, crisp 2D linework, no scenic background.",
    `Locked style: ${STYLE}.`,
    `Character identity: ${identityParagraph(c)}`,
    `Layout: full-body front, three-quarter, side and back views at the same scale in one row; below them, expression studies (head and shoulders) for neutral, happy, worried, shocked, angry, determined and curious; ${extras.join("; ")}.`,
    "Keep the anatomy, outline thickness, costume, proportions and colors identical across all panels. Do not show different characters, alternate costumes, realistic shading, gradients, extra limbs, extra fingers or redesigned faces. No text, labels, letters, logos or watermarks inside the image.",
  ].join("\n");
};

const palette = (c: CharacterBible) => Object.entries(c.colors).map(([k, v]) => `${k} \`${v}\``).join(" · ");

export const buildPromptPack = (input: PackInput): PackOutput => {
  const { roteiro, clips: file } = input;
  const errs = validateInputs(roteiro, file);
  if (errs.length) throw new Error(`Não dá para montar o pacote:\n  - ${errs.join("\n  - ")}`);
  const relic = roteiro.reliquia!;
  const n = roteiro.cenas.length;
  const measured = measureScenes(input.captions, n);
  const prompts = roteiro.cenas.map((_, i) => buildClipPrompts(roteiro, file, i, measured[i]));
  const warnings: string[] = [];
  const cast = [LEAD, ...(file.cast as CharacterBible[])];
  const totalS = n * CLIP_SECONDS;
  const sheet = input.leadSheetFile;

  prompts.forEach((p) => {
    const [i0, i1] = WORD_RANGES.image;
    const [a0, a1] = WORD_RANGES.animation;
    const [n0, n1] = WORD_RANGES.narration;
    const iMax = i1 + EXTRA_PER_CHARACTER * Math.max(0, p.imageCharacters - 1);
    const aMax = a1 + EXTRA_PER_CHARACTER * Math.max(0, p.animationCharacters - 1);
    if (p.imageDirectionWords < i0 || p.imageDirectionWords > iMax)
      warnings.push(`${p.code}: prompt de imagem com ${p.imageDirectionWords} palavras de direção (alvo ${i0}–${iMax}).`);
    if (p.animationDirectionWords < a0 || p.animationDirectionWords > aMax)
      warnings.push(`${p.code}: prompt de animação com ${p.animationDirectionWords} palavras de direção (alvo ${a0}–${aMax}).`);
    if (p.narrationWords < n0 || p.narrationWords > n1)
      warnings.push(`${p.code}: narração com ${p.narrationWords} palavras (o documento sugere ~18–24 por clipe de 10 s).`);
    if (p.measuredMs !== null && p.measuredMs > (CLIP_SECONDS - 0.5) * 1000)
      warnings.push(`${p.code}: a narração medida tem ${(p.measuredMs / 1000).toFixed(1)} s — não cabe com folga em ${CLIP_SECONDS} s.`);
  });

  const L: string[] = [];
  const h = (s: string) => L.push("", s, "");

  // ---------------- capa ----------------
  L.push(`# ${roteiro.titulo} — production package`);
  L.push(
    "",
    `Series: **Relics of the Old Days** · Episode relic: **${relic.nome}** · Generated by \`npm run prompt-pack -- ${roteiro.slug}\` from \`src/stickman/bible.ts\`, \`roteiro.json\`, \`clips.json\` and \`pesquisa.md\`.`,
    "",
    "> These are written prompts. No image or video has been generated by this package. Google Flow / Higgsfield models change often: check the current model's clip length, reference-image support and audio options in the tool before relying on a 10-second take (see the assembly guide for trimming and extending).",
  );

  // ---------------- lock ----------------
  h("## 0. Project lock");
  const measuredTotal = measured.every((m) => m !== null)
    ? ` · measured narration ${(measured.reduce((a, m) => a + (m ?? 0), 0) / 1000).toFixed(1)} s`
    : "";
  L.push(
    `- **Title:** ${roteiro.titulo}`,
    `- **Relic:** ${relic.nome} — ${relic.descricao}`,
    `- **Question:** ${roteiro.perguntaCentral}`,
    `- **Present-day scope (fact):** ${file.project.scope}`,
    `- **Future comparison (fiction):** ${file.project.futureWay}`,
    `- **Ending insight:** ${file.project.insight}`,
    `- **Duration:** ${totalS} s on the editorial timeline (${n} clips × ${CLIP_SECONDS} s)${measuredTotal}`,
    `- **Language:** English voiceover (${roteiro.vozId ?? "default voice"}) · **Aspect ratio:** 9:16 · **Tone:** ${file.project.tone}`,
    `- **Characters:** ${cast.map((c) => `${c.id} ${c.name}`).join(", ")}${file.clips.some((c) => c.characters.some((p) => p.id === "crowd")) ? ", plus generic background people" : ""}`,
  );

  // ---------------- 1. fatos ----------------
  h("## 1. Present-day fact brief and sources");
  L.push(
    "> Every present-day claim below is **sourced** (bracketed numbers point to the sources). Everything about planet Lumen and the far future is **fiction** and is never a prediction.",
    "",
    demote(input.pesquisa.trim()),
  );

  // ---------------- 2. bíblia ----------------
  h("## 2. Series bible (fixed — reuse exactly)");
  L.push(
    `- **Lead:** ${LEAD.name} (${LEAD.id}) — ${LEAD.role}`,
    `- **Planet:** ${PLANET.name} *(fiction)* — ${PLANET.look}. Year: ${PLANET.year}.`,
    `- **Daily life in the future** *(fiction)*: ${PLANET.dailyLife.join("; ")}.`,
    `- **Time travel — ${TIME_TRAVEL.name}** *(fiction)*: ${TIME_TRAVEL.steps.map((s, i) => `(${i + 1}) ${s}`).join("; ")}. ${TIME_TRAVEL.rule}`,
    `- **Present-day people:** ${PRESENT_PEOPLE.rule}`,
    `- **Future background citizens:** ${FUTURE_PEOPLE.rule}`,
    `- **Sound identity:** future — ${SOUND.future}; present — ${SOUND.present}; time travel — ${SOUND.travel}; music — ${SOUND.music}.`,
    `- **Additions to the bible:** ${ADDITIONS.length ? ADDITIONS.join("; ") : "none so far"}.`,
  );

  // ---------------- 3. história ----------------
  h("## 3. Story and narration by clip");
  L.push("The narrator is Kip, speaking from his own time about the old days (our present). Narration stays outside the visual prompts.", "");
  L.push("| Clip | Time | Era | Narration (exact) | Main visual action | Purpose |", "|---|---|---|---|---|---|");
  roteiro.cenas.forEach((c, i) => {
    const era = eraInfo(c.era as EraKey);
    const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
    L.push(
      `| ${clipCode(i)} | ${clipRange(i)} | ${era.label} | ${cell(plain(c.narracao))} | ${cell(c.acao ?? file.clips[i].opening)} | ${cell(file.clips[i].purpose)} |`,
    );
  });
  L.push(
    "",
    "Word counts and measured length: " +
      prompts
        .map((p) => `${p.code} ${p.narrationWords} words${p.measuredMs !== null ? ` / ${(p.measuredMs / 1000).toFixed(1)} s` : ""}`)
        .join(" · ") +
      ". The ~18–24 words per clip rule is an estimate; the measured times come from the actual voiceover.",
  );

  // ---------------- 4. estilo ----------------
  h("## 4. Visual style and character designs");
  L.push(`**Locked style:** ${STYLE}.`, "");
  L.push(
    "| Element | Future (fiction) | Present day |",
    "|---|---|---|",
    `| Background | cool off-white \`${ERAS.future.background}\` | warm off-white \`${ERAS.present.background}\` |`,
    `| Scenery | ${ERAS.future.scenery} | ${ERAS.present.scenery} |`,
    `| Accents | ${ERAS.future.accents.map((a) => `\`${a}\``).join(", ")} | ${ERAS.present.accents.map((a) => `\`${a}\``).join(", ")} |`,
    `| Costume | Kip's tunic, halo and Chrono-Band | ordinary clothes for background people |`,
    `| On-screen label (added in the editor) | ${ERAS.future.label} | ${ERAS.present.label} |`,
    "",
    "Kip keeps his future design in every era, so he always stands out in present-day scenes.",
  );
  for (const c of cast) {
    L.push("", `### ${c.id} · ${c.name}`, "", `- **Palette:** ${palette(c)}`, `- **Immutable:** ${c.immutable.join("; ")}`, `- **May change:** ${c.changeable.join("; ")}`, "", "**Identity paragraph (paste verbatim):**", "", fence(identityParagraph(c)));
  }
  L.push("", `**The relic — ${relic.nome} (paste verbatim wherever it appears):**`, "", fence(file.relicDescription));

  // ---------------- 5. folhas de personagem ----------------
  h("## 5. Character reference sheet prompts");
  L.push(
    "Generate one sheet per character. Keep the full sheet as the master reference; when a multi-panel sheet confuses scene generation, attach a cropped single view (front or three-quarter). A filename written in a prompt does **not** make a reference available to a model — attach the image itself.",
  );
  if (sheet) {
    L.push("", `A code-rendered sheet of Kip is included as \`${sheet}\` (drawn by the Remotion rig, exact colors). You can attach it as a reference, or generate a new sheet with the prompt below and compare.`);
  }
  for (const c of cast) {
    L.push("", `### ${c.id} · ${c.name}`, "", `Metadata (outside the image, because generated labels are unreliable): ID **${c.id}** · palette ${palette(c)}`, "", "**CHARACTER REFERENCE SHEET PROMPT**", "", fence(referenceSheetPrompt(c)));
  }

  // ---------------- 6. agente de consistência ----------------
  h("## 6. Character consistency agent instructions");
  L.push("Paste this whole block into a separate chat or image agent. It works without this conversation.", "");
  const refs = [
    sheet ? `${LEAD.id}: code-rendered character sheet "${sheet}" (attach it; until it is attached, rely provisionally on the written design)` : `${LEAD.id}: no approved reference image yet — rely provisionally on the written design`,
    ...file.cast.map((c) => `${c.id}: no approved reference image yet — generate it from its reference sheet prompt and approve it first`),
  ];
  const continuityRows = file.clips
    .map((clip, i) => {
      const c = roteiro.cenas[i];
      const o = clip.outgoing;
      return `${clipCode(i)} | era: ${eraInfo(c.era as EraKey).label} | characters: ${clip.characters.map((p) => p.id).join(", ")} | location: ${clip.location} | time of day: ${clip.timeOfDay} | costume: ${clip.characters.map((p) => `${p.id} ${p.costume}`).join("; ")} | OUT positions: ${o.positions} | direction: ${o.direction} | prop owner: ${o.propOwner} | hand: ${o.propHand} | emotion: ${o.emotion} | persistent changes: ${o.changes} | next clip: ${o.nextMatches ? "matches this last frame" : "intentional cut"}`;
    })
    .join("\n");
  const agent = [
    "CHARACTER CONSISTENCY AGENT INSTRUCTIONS",
    "",
    REQUIRED_AGENT_OPENING,
    "",
    "PROJECT",
    `Series: Relics of the Old Days. Episode: "${roteiro.titulo}". Relic: ${relic.nome}. Question: ${roteiro.perguntaCentral} Present-day scope (fact): ${file.project.scope}. Future way (fiction): ${file.project.futureWay}. Insight: ${file.project.insight}. Format: ${n} clips of ${CLIP_SECONDS} s, vertical 9:16, English voiceover added in the editor, tone: ${file.project.tone}.`,
    "",
    "SERIES BIBLE",
    `Lead: ${LEAD.name} (${LEAD.id}). Planet: ${PLANET.name} (fiction) — ${PLANET.look}. Daily life (fiction): ${PLANET.dailyLife.join("; ")}. Time travel: ${TIME_TRAVEL.steps.join("; ")}. ${TIME_TRAVEL.rule} Present-day people: ${PRESENT_PEOPLE.rule} Future background citizens: ${FUTURE_PEOPLE.rule}`,
    "",
    "ERA RULES",
    `Future: ${ERAS.future.scenery}; cool off-white ${ERAS.future.background}; accents ${ERAS.future.accents.join(", ")}. Present day: ${ERAS.present.scenery}; warm off-white ${ERAS.present.background}; accents ${ERAS.present.accents.join(", ")}. Keep the eras separate. The lead keeps his future design in the present day. The relic and the lead's own gear are the only future or out-of-place elements allowed to cross between eras. Never give future scenery to present-day scenes, or present-day clutter to future scenes.`,
    "",
    "VISUAL STYLE",
    `${STYLE}.`,
    "",
    "CHARACTER IDENTITIES (verbatim)",
    ...cast.map((c) => `${c.id}: ${identityParagraph(c)}`),
    "",
    `RELIC (${relic.nome})`,
    file.relicDescription,
    "",
    "APPROVED REFERENCES",
    ...refs,
    "",
    "LOCK RULES",
    "Lock head shape, proportions, line weight, facial feature spacing, hair or headwear, costume shapes, accent colors, and signature accessories. Never transfer one character's features or clothing to another. Preserve character scale relative to recurring props and other characters. Keep left and right accessories consistent in the character's own orientation (Kip's Chrono-Band is always on HIS LEFT wrist). Do not invent costume variants, missing props, extra fingers, extra limbs, merged bodies, or duplicate leads.",
    "",
    "CONTINUITY RECORD",
    "Keep a record per clip with: clip ID, era, characters present, location, time of day, costume state, expression, pose, position in frame, direction of movement, prop owner, which hand holds the prop, and any persistent physical changes. Record the outgoing state and the next clip's incoming state. Do not silently reset a dropped object, damaged costume, opened door, or changed location. At an intentional cut or time jump, state what changes and what stays fixed.",
    "Planned record for this episode:",
    continuityRows,
    "",
    "REFERENCES, HONESTLY",
    "Require the approved reference images to be attached where the tool supports references. If an image is unavailable, say so and rely provisionally on the written design. If a written design and a reference conflict, report the specific mismatch and ask only the necessary question. Do not claim that a seed, a repeated name or a text-only instruction guarantees identity. Use a fixed seed only if the chosen tool actually supports it.",
    "",
    "REVIEW BEHAVIOR",
    "Before returning any new scene prompt, compare it with the project style, the series bible, the character identities and the continuity record. For an uploaded output, report PASS or REVISE only for features you can actually inspect. If revision is needed, give a precise corrective prompt listing the mismatched traits and the required replacements. Never silently change the approved design to match a flawed generation.",
    "",
    "OUTPUT CONTRACT",
    "Return, in this order: (1) the requested scene prompt or correction; (2) a brief continuity check; (3) the updated outgoing state. Keep (2) and (3) outside the image or animation prompt so they are never treated as on-screen text.",
  ].join("\n");
  L.push(fence(agent));

  // ---------------- 7. clipes ----------------
  h("## 7. Clip packages");
  roteiro.cenas.forEach((c, i) => {
    const clip = file.clips[i];
    const p = prompts[i];
    const era = eraInfo(c.era as EraKey);
    const v = input.voice?.[i] ?? null;
    const attach = clip.characters
      .filter((x, k, arr) => x.id !== "crowd" && arr.findIndex((y) => y.id === x.id) === k)
      .map((x) => (x.id === LEAD.id ? `${LEAD.id} reference (${sheet ?? "the approved FL-01 sheet"}; crop to one view if needed)` : `${x.id} approved reference sheet`));
    if (i > 0 && file.clips[i - 1].outgoing.nextMatches) attach.push(`last frame of ${clipCode(i - 1)}_video (this clip continues from it)`);
    L.push(
      `### ${p.code} · ${clipRange(i)} · ${era.label}`,
      "",
      `- **Purpose:** ${clip.purpose}`,
      `- **Narration (voiceover, not in the prompts):** “${plain(c.narracao)}” — ${p.narrationWords} words${p.measuredMs !== null ? `, measured ${(p.measuredMs / 1000).toFixed(1)} s` : ""}${v ? ` → \`${v.file}\`` : ""}`,
      `- **Characters and references to attach:** ${attach.join("; ")}`,
      "",
      `**Scene-image prompt** (${p.imageWords} words: ${p.imageDirectionWords} of clip direction + the locked blocks, verbatim)`,
      "",
      fence(p.image),
      "",
      `**Animation prompt** (${p.animationWords} words: ${p.animationDirectionWords} of clip direction + the locked blocks, verbatim)`,
      "",
      fence(p.animation),
      "",
      `**Sound notes:** era bed — ${era.sound}. Effects: ${clip.sound.sfx.join("; ")}. Music: ${clip.sound.music}. No character speech or lip sync.`,
      "",
      `**Outgoing state:** positions — ${clip.outgoing.positions}; direction — ${clip.outgoing.direction}; prop owner — ${clip.outgoing.propOwner}; hand — ${clip.outgoing.propHand}; emotion — ${clip.outgoing.emotion}; persistent changes — ${clip.outgoing.changes}. ${i + 1 < n ? (clip.outgoing.nextMatches ? `${clipCode(i + 1)} starts from this exact frame.` : `${clipCode(i + 1)} uses an intentional cut: ${clip.transition}`) : "End of the episode."}`,
      "",
    );
  });

  // ---------------- 8. montagem ----------------
  h("## 8. Assembly guide and continuity checklist");
  L.push(
    "1. Generate the reference sheets (section 5).",
    "2. Review and correct the designs against the identity paragraphs (use the agent in section 6).",
    "3. Generate each scene image with the references attached → `C01_scene.png` … ",
    "4. Animate each scene image with its animation prompt → `C01_video.mp4` …",
    "5. Review identity and action (halo, tunic trim, Chrono-Band on HIS LEFT wrist, prop in the right hand).",
    "6. Regenerate only the clips with material problems.",
    `7. Assemble the numbered clips on a ${totalS}-second timeline: clip *n* starts at (n − 1) × ${CLIP_SECONDS} s.`,
    `8. Add and time the narration: place \`C0n_voice\` at the start of clip *n*${input.voice?.some(Boolean) ? " (the files in this folder were cut from the measured voiceover)" : ""}.`,
    "9. Place sound effects and music (sound notes per clip; a distinct sound for each era and for the time jump).",
    `10. Add optional captions and verified labels${input.captions?.length ? " (`captions-editorial.srt` in this folder is already timed to this 10-second-per-clip layout)" : ""}; type the era labels in the editor (${ERAS.future.label} / ${ERAS.present.label}), never in the generator.`,
    "11. Export 9:16 (1080×1920).",
    "",
    "**Naming:** `C01_scene.png`, `C01_video.mp4`, `C01_voice.mp3` … `C06_…`.",
    "",
    `**Duration, honestly:** the editorial timeline is ${CLIP_SECONDS} s per clip, so ${n} clips = ${totalS} s. Check each generated take before export. If a take is longer, trim it on a calm moment; if shorter, generate an extension from its last frame or combine two takes with a deliberate cut. Do not slow motion or stretch speech so far that it looks or sounds unnatural. Writing “exactly 10 seconds” in a prompt never guarantees the exported length.`,
    "",
    "**Final checklist**",
    "",
  );
  const allPrompts = prompts.every((p) => p.image && p.animation);
  const narrationOk = prompts.every((p) => p.measuredMs === null || p.measuredMs <= (CLIP_SECONDS - 0.5) * 1000);
  const statesOk = file.clips.every((c) => c.outgoing.positions && c.finalState);
  const check = (ok: boolean | null, s: string) => L.push(`- [${ok ? "x" : " "}] ${s}${ok === null ? " *(check by hand)*" : ""}`);
  check(true, `The topic is specific and built around one relic (${relic.nome}).`);
  check(null, "Important present-day claims are supported by sources (section 1).");
  check(true, "Future fiction is marked as fiction; present-day claims as sourced.");
  check(true, `The series bible is respected; additions: ${ADDITIONS.length ? ADDITIONS.length : "none"}.`);
  check(true, "The two eras are visually distinct (palette, scenery, sound).");
  check(null, "The story has a hook, a clear comparison and a clear outcome.");
  check(input.captions?.length ? narrationOk : null, "Narration fits the intended duration.");
  check(true, `Every recurring character has a reference prompt (${cast.map((c) => c.id).join(", ")}).`);
  check(true, "The separate consistency agent prompt is complete.");
  check(allPrompts, "Every clip has a full still-image prompt and a full animation prompt.");
  check(true, "Action timing covers 0–10 s in every clip.");
  check(statesOk, "Incoming and outgoing states agree (section 6 record).");
  check(true, "Assembly instructions explain how to reach the final duration.");

  const markdown = L.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
  if (PLACEHOLDER_RE.test(markdown)) warnings.push("O pacote contém um placeholder (TODO/TBD/{{…}}/“same as before”). Preencha o clips.json.");
  return { markdown, clips: prompts, warnings };
};

/** Legendas no tempo da montagem de 10 s por clipe (cada voz começa no início do clipe + leadMs). */
export const editorialCaptions = (
  captions: VideoCaption[],
  n: number,
  leadMs = 150,
): { text: string; startMs: number; endMs: number }[] => {
  const out: { text: string; startMs: number; endMs: number }[] = [];
  for (let i = 0; i < n; i++) {
    const w = captions.filter((c) => c.scene === i);
    if (!w.length) continue;
    const shift = i * CLIP_SECONDS * 1000 + leadMs - w[0].startMs;
    let line: VideoCaption[] = [];
    const flush = () => {
      if (!line.length) return;
      out.push({
        text: line.map((x) => x.text.trim()).join(" "),
        startMs: line[0].startMs + shift,
        endMs: line[line.length - 1].endMs + shift,
      });
      line = [];
    };
    for (const word of w) {
      line.push(word);
      if (line.length >= 3 || /[.,!?;:]$/.test(word.text.trim())) flush();
    }
    flush();
  }
  return out;
};
