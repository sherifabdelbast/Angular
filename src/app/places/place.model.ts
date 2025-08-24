export interface Place {
  id: string;
  title: string;
  image: {
    src: string;
    alt: string;
    webp400: string;
    webp800: string;
    src400: string;
    src800: string;
  };
  lat: number;
  lon: number;
}
