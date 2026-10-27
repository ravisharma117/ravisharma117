#!/usr/bin/env node
/**
 * Builds README.md from README.template.md plus the live portfolio projects.
 *
 *   node scripts/build-readme.mjs
 *
 * Data comes from the public, read-only endpoint
 * GET /api/public/projects?site=imravithedev - no password, no DB connection.
 * NDA projects are already excluded there and NDA image URLs come back null.
 *
 * Env:
 *   API_BASE   default https://naxits-api.netlify.app
 *   SITE_BASE  default https://imravithedev.com (for "Details" links)
 *
 * Any fetch/shape failure exits non-zero, so the scheduled workflow never
 * commits a README with an empty projects section.
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = (process.env.API_BASE ?? "https://naxits-api.netlify.app").replace(/\/+$/, "");
const SITE = (process.env.SITE_BASE ?? "https://imravithedev.com").replace(/\/+$/, "");

const MARKER = "<!-- PROJECTS -->";
// Cover crop for the cards. f_jpg rather than f_auto: GitHub's image proxy
// (camo) does not forward the browser's Accept header, so pin the format.
const COVER_TRANSFORM = "c_fill,g_auto,w_420,h_236,f_jpg,q_auto";
const CARD_KEYWORDS = 6;
const ROW_KEYWORDS = 5;
const SUMMARY_MAX = 160;

const get = async (path) => {
  const res = await fetch(`${API}${path}`);
  const text = await res.text();
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status} ${text.slice(0, 300)}`);
  return JSON.parse(text);
};

/** Insert a Cloudinary transform right after /upload/ (same idea as cloudinaryVariant in imravithedev). */
const cloudinaryVariant = (url, transform) => {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
};

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const decodeEntities = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

/** Plain-text first sentence of the HTML description, clipped to SUMMARY_MAX. */
const summarize = (html) => {
  if (!html) return "";
  const firstBlock = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? html;
  const text = decodeEntities(firstBlock.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  const sentence = text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;
  if (sentence.length <= SUMMARY_MAX) return sentence;
  return `${sentence.slice(0, SUMMARY_MAX).replace(/\s+\S*$/, "")}…`;
};

/** shields.io static-badge label: '-' and '_' are separators, so double them; then URL-encode. */
const badgeLabel = (s) => encodeURIComponent(s.replace(/-/g, "--").replace(/_/g, "__"));

const keywordBadge = (k) =>
  `<img src="https://img.shields.io/badge/${badgeLabel(k)}-334155?style=flat-square" alt="${escapeHtml(k)}" />`;

const projectLinks = (p) => {
  const links = [];
  if (p.live_url) links.push(`<a href="${escapeHtml(p.live_url)}">🌐 Live</a>`);
  if (p.github_url) links.push(`<a href="${escapeHtml(p.github_url)}">💻 Code</a>`);
  links.push(`<a href="${SITE}/projects/${encodeURIComponent(p.id)}">📖 Details</a>`);
  return links.join(" &nbsp;·&nbsp; ");
};

const card = (p) => {
  const cover = cloudinaryVariant(p.image_url, COVER_TRANSFORM);
  const img = cover
    ? `<a href="${SITE}/projects/${encodeURIComponent(p.id)}"><img src="${escapeHtml(cover)}" width="100%" alt="${escapeHtml(p.title)}" /></a><br />`
    : "";
  const keywords = (p.tech_keywords ?? []).slice(0, CARD_KEYWORDS).map(keywordBadge).join(" ");
  return [
    `<td width="50%" valign="top">`,
    img,
    `<h3>${escapeHtml(p.title)}</h3>`,
    `<p>${escapeHtml(summarize(p.description))}</p>`,
    keywords ? `<p>${keywords}</p>` : "",
    `<p>${projectLinks(p)}</p>`,
    `</td>`,
  ]
    .filter(Boolean)
    .join("\n");
};

const featuredTable = (projects) => {
  const rows = [];
  for (let i = 0; i < projects.length; i += 2) {
    const pair = projects.slice(i, i + 2).map(card);
    if (pair.length === 1) pair.push(`<td width="50%"></td>`);
    rows.push(`<tr>\n${pair.join("\n")}\n</tr>`);
  }
  return `<table>\n${rows.join("\n")}\n</table>`;
};

const othersTable = (projects) => {
  const head = "| Project | Stack | Links |\n|---|---|---|";
  const rows = projects.map((p) => {
    const stack = (p.tech_keywords ?? []).slice(0, ROW_KEYWORDS).join(", ");
    // Pipes would break the markdown table.
    const cell = (s) => escapeHtml(s).replace(/\|/g, "&#124;");
    return `| **${cell(p.title)}** | ${cell(stack)} | ${projectLinks(p)} |`;
  });
  return [head, ...rows].join("\n");
};

const main = async () => {
  const projects = await get("/api/public/projects?site=imravithedev");
  if (!Array.isArray(projects) || projects.length === 0) {
    throw new Error(`Expected a non-empty project array, got: ${JSON.stringify(projects).slice(0, 200)}`);
  }

  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);
  const techCount = new Set(projects.flatMap((p) => p.tech_keywords ?? []).map((k) => k.toLowerCase())).size;

  const sections = [];
  if (featured.length) sections.push(`### ⭐ Featured\n\n${featuredTable(featured)}`);
  if (others.length) sections.push(`### 🗂️ More Projects\n\n${othersTable(others)}`);
  sections.push(`<p align="center"><a href="${SITE}"><b>See every project, with screenshots, on my portfolio →</b></a></p>`);

  const template = await readFile(join(ROOT, "README.template.md"), "utf8");
  if (!template.includes(MARKER)) throw new Error(`README.template.md is missing ${MARKER}`);

  const readme = template
    // Drop the leading maintainer comment; it is for the template only.
    .replace(/^<!--[\s\S]*?-->\s*/, "")
    .replace(MARKER, sections.join("\n\n"))
    .replaceAll("{{projectCount}}", String(projects.length))
    .replaceAll("{{techCount}}", `${techCount}+`);

  await writeFile(join(ROOT, "README.md"), readme);
  console.log(`README.md written: ${featured.length} featured, ${others.length} more, ${techCount} technologies.`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
