import { useState, useEffect, MutableRefObject } from "react";
type Maprect = {
  x: number;
  y: number;
  width: number;
  height: number;
  fullWidth: number;
  fullHeight: number;
};

// Takes url as image and reference to the div containing the image
// Returns BoundiNgClientRect for the image
const useGetMapRect = (
  map: string,
  mapRef: MutableRefObject<HTMLDivElement | null>
) => {
  const [mapRect, setMapRect] = useState<Maprect | null>(null);
  const [hasError, setHasError] = useState(false);

  // Load the dimensions for background
  useEffect(() => {
    if (!mapRef || !mapRef.current || !map) return;

    const currentMapRef = mapRef.current;
    if (!currentMapRef) return;

    const refreshBoundingClient = () => {
      const img = new Image();
      img.src = map;

      const boundingClient = currentMapRef.getBoundingClientRect();

      img.onload = () => {
        setMapRect({
          x: boundingClient.x,
          y: boundingClient.y,
          width: boundingClient.width,
          height: boundingClient.height,
          fullWidth: img.width,
          fullHeight: img.height,
        });
      };
    };
    refreshBoundingClient();

    window.addEventListener("resize", refreshBoundingClient);

    return () => window.removeEventListener("resize", refreshBoundingClient);
  }, [map, mapRef.current, hasError]);

  return mapRect;
};

export default useGetMapRect;
