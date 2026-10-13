export interface MediaImage {
  readonly kind: "image";
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly width?: number;
  readonly height?: number;
}

export interface MediaVideo {
  readonly kind: "video";
  readonly id: string;
  readonly url: string;
  readonly posterUrl?: string;
}

export type Media = MediaImage | MediaVideo;
