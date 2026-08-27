export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl: string | null;
}

let idCounter = 0;

export function createUploadedFiles(fileList: FileList): UploadedFile[] {
  return Array.from(fileList).map((file) => ({
    id: `f${Date.now()}-${idCounter++}`,
    name: file.name,
    size: file.size,
    type: file.type,
    previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
  }));
}

export function revokeUploadedFiles(files: UploadedFile[]): void {
  for (const file of files) {
    if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function truncateName(name: string, max = 28): string {
  if (name.length <= max) return name;
  const dot = name.lastIndexOf(".");
  const ext = dot > -1 ? name.slice(dot) : "";
  const base = dot > -1 ? name.slice(0, dot) : name;
  const keep = Math.max(1, max - ext.length - 1);
  return `${base.slice(0, keep)}…${ext}`;
}
