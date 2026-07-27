import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];
const required = [
  "dist/index.html",
  "supabase/schema.sql",
  "supabase/objectives-migration.sql",
  "supabase/collaborative-objectives-migration.sql",
  "supabase/commerce-v1.1-migration.sql",
  "supabase/commerce-v1.2-migration.sql",
  "supabase/commerce-v1.3-migration.sql",
  "supabase/finance-v1.4-migration.sql",
  "supabase/audit-v1.7-migration.sql",
  "supabase/maison-v1.8-migration.sql",
  "supabase/security-v1.10-migration.sql",
  "README.md",
  "CHANGELOG.md",
  "VERSION",
];
const forbidden = [
  "public/sw.js",
  "public/manifest.webmanifest",
  "supabase/login-attempts.sql",
];

for (const file of required)
  if (!existsSync(join(root, file)))
    failures.push(`Arquivo obrigatório ausente: ${file}`);
for (const file of forbidden)
  if (existsSync(join(root, file)))
    failures.push(`Arquivo proibido presente: ${file}`);

const packageJson = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
);
const version = readFileSync(join(root, "VERSION"), "utf8").trim();
if (packageJson.version !== version)
  failures.push(
    `Versões divergentes: package=${packageJson.version}, VERSION=${version}`,
  );

const walk = (directory) =>
  readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
const buildFiles = existsSync(join(root, "dist"))
  ? walk(join(root, "dist"))
  : [];
const buildText = buildFiles
  .filter((file) => /\.(js|html)$/i.test(file))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");
for (const mock of [
  "Projeto Nuvem",
  "Coleção Aurora",
  "Marina Costa",
  "R$ 46.280",
])
  if (buildText.includes(mock))
    failures.push(`Dado demonstrativo no build: ${mock}`);

if (failures.length) {
  console.error("\nFalha na verificação de produção:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`\nVerificação de produção aprovada — Nexo ERP v${version}`);
console.log(`${buildFiles.length} arquivos inspecionados no pacote final.`);
