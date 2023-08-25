import { useState, useEffect, MutableRefObject } from "react";
import { Maprect } from "~/types";
// Takes url as image and reference to the div containing the image
// Returns BoundiNgClientRect for the image
const useGetMapRect = (
  map: string,
  mapRef: MutableRefObject<HTMLDivElement | null>
) => {
  const [mapRect, setMapRect] = useState<Maprect | null>(null);

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

    console.log("Getting mapRect");

    window.addEventListener("resize", refreshBoundingClient);

    return () => window.removeEventListener("resize", refreshBoundingClient);
  }, [map, mapRef.current]);

  return mapRect;
};

export default useGetMapRect;
