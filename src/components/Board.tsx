import React, { useEffect, useState, useRef } from "react";

import DungeonMap from "./DungeonMap";
import useGetMapRect from "../hooks/useGetMapRect";
const defaultMap = "/img/dungeonmap.jpg";

type Spriteinfo = {
  name: string;
  posX: number;
  posY: number;
  imgSrc: string;
  controller: string;
};

type Maprect = {
  x: number;
  y: number;
  width: number;
  height: number;
  fullWidth: number;
  fullHeight: number;
};

const Board = () => {
  const [sprites, setSprites] = useState<Array<Spriteinfo>>([]);
  // TO DO: Condense states into obj

  const [map, setMap] = useState(defaultMap);
  const [mapPosX, setMapPosX] = useState(0);
  const [mapPosY, setMapPosY] = useState(0);
  const [mapZoom, setMapZoom] = useState(6);
  const [hasLoaded, setHasLoaded] = useState(false);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapRect = useGetMapRect(map, mapRef);

  // Create sprites
  useEffect(() => {
    if (mapRect && !sprites?.length) {
      setSprites([
        {
          name: "goblin1",
          posX: 0,
          posY: 0,
          imgSrc: "/img/goblin.png",
          controller: "dm",
        },
        {
          name: "goblin2",
          posX: 50,
          posY: 0,
          imgSrc: "/img/goblin.png",
          controller: "dm",
        },
      ]);
    }
  }, [mapRect]);

  return (
    <>
      <DungeonMap
        key={JSON.stringify(mapRect)}
        mapRef={mapRef}
        setSprites={setSprites}
        sprites={sprites}
        mapRect={mapRect}
        map={map}
        mapPosX={mapPosX}
        setMapPosX={setMapPosX}
        setMapPosY={setMapPosY}
        mapPosY={mapPosY}
        mapZoom={mapZoom}
        hasLoaded={hasLoaded}
        setHasLoaded={setHasLoaded}
      />
    </>
  );
};

export default Board;
