import React, { useEffect, useState, useRef } from "react";

import DungeonMap from "./DungeonMap";
import useGetMapRect from "../hooks/useGetMapRect";
const defaultMap = "/img/dungeonmap.jpg";

import { Spriteinfo, MapProps } from "~/types";

const Board = () => {
  const [sprites, setSprites] = useState<Array<Spriteinfo>>([]);
  // TO DO: Condense states into obj

  const [map, setMap] = useState<MapProps>({
    imgSrc: defaultMap,
    posX: 0,
    posY: 0,
    height: 25,
    width: 25,
    zoom: 6,
    hasLoaded: false,
  });

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapRect = useGetMapRect(map.imgSrc, mapRef);

  // Create sprites
  useEffect(() => {
    if (mapRect && !sprites?.length) {
      setSprites([
        {
          name: "goblin1",
          posX: 0,
          posY: 0,
          height: 0,
          width: 0,
          imgSrc: "/img/goblin.png",
          controller: "dm",
        },
        {
          name: "goblin2",
          posX: 50,
          posY: 0,
          height: 0,
          width: 0,
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
        setMap={setMap}
      />
    </>
  );
};

export default Board;
