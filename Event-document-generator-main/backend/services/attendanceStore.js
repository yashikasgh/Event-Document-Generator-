import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.resolve(__dirname, "../data");
const storePath = path.join(dataDirectory, "attendance-store.json");

const defaultStore = {
  rosters: [],
};

const normalizeStore = (store = {}) => ({
  rosters: Array.isArray(store.rosters) ? store.rosters : [],
});

const ensureStoreFile = async () => {
  await mkdir(dataDirectory, { recursive: true });
  try {
    const raw = await readFile(storePath, "utf8");
    return normalizeStore(JSON.parse(raw));
  } catch {
    await writeFile(storePath, JSON.stringify(defaultStore, null, 2), "utf8");
    return defaultStore;
  }
};

export const readAttendanceStore = async () => ensureStoreFile();

export const writeAttendanceStore = async (nextStore) => {
  const normalized = normalizeStore(nextStore);
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(storePath, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
};

export const saveAttendanceRoster = async (roster) => {
  const store = await ensureStoreFile();
  const filtered = store.rosters.filter((entry) => entry.id !== roster.id);
  const nextStore = {
    rosters: [roster, ...filtered].slice(0, 50),
  };
  await writeAttendanceStore(nextStore);
  return roster;
};
