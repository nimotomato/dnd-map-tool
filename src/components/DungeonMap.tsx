import React, { useState, useRef, useEffect } from "react";
import type { MouseEvent, MutableRefObject, SetStateAction } from "react";

import Sprite from "./Sprite";

import {
  FaArrowRight,
  FaArrowLeft,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa6";

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

type Props = {
  mapRef: MutableRefObject<HTMLDivElement | null>;
  setSprites: React.Dispatch<React.SetStateAction<Spriteinfo[]>>;
  sprites: Spriteinfo[];
  mapRect: Maprect | null;
  map: string;
  mapPosX: number;
  mapPosY: number;
  setMapPosX: React.Dispatch<React.SetStateAction<number>>;
  setMapPosY: React.Dispatch<React.SetStateAction<number>>;
  mapZoom: number;
  hasLoaded: boolean;
  setHasLoaded: React.Dispatch<React.SetStateAction<boolean>>;
};

const DungeonMap = ({
  setSprites,
  sprites,
  mapRect,
  mapRef,
  map,
  mapPosX,
  mapPosY,
  setMapPosX,
  setMapPosY,
  mapZoom,
  hasLoaded,
  setHasLoaded,
}: Props) => {
  // Stepsize in percentage
  const defaultStepSize = useRef(100);

  const handleOnMapNav = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!mapRect) return;

    const target = event.currentTarget as HTMLButtonElement;

    if (
      target.id === "right" &&
      mapPosX > -mapRect.fullWidth - defaultStepSize.current * 3
    ) {
      setMapPosX((prev) => prev - defaultStepSize.current);
    } else if (target.id === "left" && mapPosX < 0) {
      setMapPosX((prev) => prev + defaultStepSize.current);
    } else if (
      target.id === "down" &&
      mapPosY > -mapRect.fullHeight - defaultStepSize.current
    ) {
      setMapPosY((prev) => prev - defaultStepSize.current);
    } else if (target.id === "up" && mapPosY < 0) {
      setMapPosY((prev) => prev + defaultStepSize.current);
      console.log(mapPosY);
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    setHasLoaded(true);
  }, []);

  return (
    <>
      <div ref={mapRef} className="relative h-96 w-96">
        {hasLoaded ? (
          <>
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `${map}`,
                backgroundPosition: `${mapPosX}px ${mapPosY}px`,
                backgroundSize: `${mapZoom * 100}%`,
              }}
            >
              {sprites?.map((sprite) => {
                return (
                  <Sprite
                    posX={sprite.posX}
                    mapPosX={mapPosX}
                    mapPosY={mapPosY}
                    posY={sprite.posY}
                    key={sprite.name}
                    mapRect={mapRect}
                    controller={sprite.controller}
                    imgSrc={sprite.imgSrc}
                    setSprites={setSprites}
                    name={sprite.name}
                    sprites={sprites}
                  />
                );
              })}
            </div>
            <div>
              <button onClick={handleOnMapNav} className="nav-btn" id="up">
                <FaArrowUp />
              </button>
              <button onClick={handleOnMapNav} className="nav-btn" id="down">
                <FaArrowDown />
              </button>
              <button onClick={handleOnMapNav} className="nav-btn" id="left">
                <FaArrowLeft />
              </button>
              <button onClick={handleOnMapNav} className="nav-btn" id="right">
                <FaArrowRight />
              </button>
            </div>
          </>
        ) : (
          <h1>Loading map</h1>
        )}
      </div>
    </>
  );
};

export default DungeonMap;
