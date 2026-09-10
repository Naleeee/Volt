// In-memory stand-in for the expo-file-system classes used by media.ts and export-history.ts.
// Directories are stored as null, files as their string content.
const entries = new Map<string, string | null>();

export const fakeFs = { entries, reset: () => entries.clear() };

type Parent = string | { uri: string };

function join(parent: Parent, name?: string) {
  const base = typeof parent === "string" ? parent : parent.uri;
  return name === undefined ? base : `${base.replace(/\/$/, "")}/${name}`;
}

export class Directory {
  uri: string;
  constructor(parent: Parent, name?: string) {
    this.uri = join(parent, name);
  }
  get exists() {
    return entries.get(this.uri) === null;
  }
  create() {
    entries.set(this.uri, null);
  }
  delete() {
    for (const key of [...entries.keys()])
      if (key === this.uri || key.startsWith(`${this.uri}/`)) entries.delete(key);
  }
}

export class File {
  uri: string;
  constructor(parent: Parent, name?: string) {
    this.uri = join(parent, name);
  }
  get exists() {
    return typeof entries.get(this.uri) === "string";
  }
  create() {
    entries.set(this.uri, "");
  }
  write(content: string) {
    entries.set(this.uri, content);
  }
  delete() {
    entries.delete(this.uri);
  }
  async copy(destination: File) {
    entries.set(destination.uri, entries.get(this.uri) ?? "");
  }
  async move(destination: File) {
    await this.copy(destination);
    entries.delete(this.uri);
    this.uri = destination.uri;
  }
}

export const Paths = {
  document: new Directory("file:///document"),
  cache: new Directory("file:///cache"),
};
