import type { DownloadFile, Downloader } from '../../domain/ports/Downloader';

export class BrowserDownloader implements Downloader {
  download(file: DownloadFile): void {
    const blob = new Blob([file.contents], { type: file.mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}
