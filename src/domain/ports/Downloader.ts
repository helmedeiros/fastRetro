export interface DownloadFile {
  readonly filename: string;
  readonly mimeType: string;
  readonly contents: string;
}

export interface Downloader {
  download(file: DownloadFile): void;
}
