/**
 * Lists every table in the public schema via the Supabase service role.
 * Run: node scripts/list-all-tables.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
readFileSync(resolve(root, ".env"), "utf8")
  .split("\n")
  .forEach((line) => {
    const m = line.match(/^\s*([^#=\s][^=]*?)\s*=\s*"?(.+?)"?\s*$/);
    if (m) env[m[1]] = m[2];
  });

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await supabase.rpc("get_all_tables").catch(() => ({ data: null, error: "rpc not available" }));

if (!data) {
  // Fall back: query information_schema directly
  const { data: tables, error: e2 } = await supabase
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_schema", "public")
    .eq("table_type", "BASE TABLE")
    .order("table_name");

  if (e2) {
    console.error("Cannot query information_schema via client API.");
    console.log("\nRun this in Supabase SQL Editor instead:\n");
    console.log("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;");
  } else {
    console.log("\nAll tables in public schema:");
    tables.forEach(t => console.log(" ", t.table_name));
  }
} else {
  data.forEach(t => console.log(t));
}
