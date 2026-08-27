import type { UploadedFile } from "./types";

export interface LibraryItem {
  id: string;
  name: string;
  size: number;
  kind: "image" | "file";
  color?: string;
}

export const IMAGE_LIBRARY: LibraryItem[] = [
  { id: "lib-img-1", name: "product-shot.jpg", size: 842_000, kind: "image", color: "#e7ddcf" },
  { id: "lib-img-2", name: "cover-art.png", size: 1_240_000, kind: "image", color: "#cfd8e7" },
  { id: "lib-img-3", name: "banner.jpg", size: 654_000, kind: "image", color: "#d8e7cf" },
  { id: "lib-img-4", name: "thumbnail.png", size: 210_000, kind: "image", color: "#e7cfd8" },
  { id: "lib-img-5", name: "hero-image.jpg", size: 1_050_000, kind: "image", color: "#cfe7e0" },
  { id: "lib-img-6", name: "square-crop.png", size: 480_000, kind: "image", color: "#e7e0cf" },
];

export const FILE_LIBRARY: LibraryItem[] = [
  { id: "lib-file-1", name: "ebook-v2.pdf", size: 3_400_000, kind: "file" },
  { id: "lib-file-2", name: "workbook.docx", size: 890_000, kind: "file" },
  { id: "lib-file-3", name: "bonus-pack.zip", size: 12_400_000, kind: "file" },
  { id: "lib-file-4", name: "guide-final.pdf", size: 2_100_000, kind: "file" },
];

function colorSwatchDataUri(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${color}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

let idCounter = 0;

export function libraryItemToUploadedFile(item: LibraryItem): UploadedFile {
  idCounter += 1;
  return {
    id: `${item.id}-${idCounter}`,
    name: item.name,
    size: item.size,
    type: item.kind === "image" ? "image/svg+xml" : "application/octet-stream",
    previewUrl: item.kind === "image" ? colorSwatchDataUri(item.color ?? "#d8d8d2") : null,
  };
}
