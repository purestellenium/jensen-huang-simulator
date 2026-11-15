const images = new Map<string, HTMLImageElement>();

export function imageFor(url: string, onLoad: () => void): HTMLImageElement | null {
  let image = images.get(url);
  if (!image) {
    image = new Image();
    image.addEventListener("load", onLoad);
    image.src = url;
    images.set(url, image);
  }
  return image.complete && image.naturalWidth > 0 ? image : null;
}
