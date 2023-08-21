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
};

type Props = {
  mapRef: MutableRefObject<HTMLDivElement | null>;
  setSprites: React.Dispatch<React.SetStateAction<Spriteinfo[] | null>>;
  sprites: Spriteinfo[] | null;
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
  const defaultStepSize = useRef(5);

  useEffect(() => {
    console.log("window", window.innerWidth);
    console.log("map", mapRect?.width);
    console.log("mapPos %", mapPosX);
    const newPos = (mapRect?.width * mapPosX) / 100;
    console.log("step in px", newPos);
    console.log("");
  }, [mapPosX]);

  const handleOnMapNav = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const target = event.currentTarget as HTMLButtonElement;

    if (target.id === "right" && mapPosX < 100) {
      setMapPosX((prev) => prev + defaultStepSize.current);
    } else if (target.id === "left" && mapPosX > 0) {
      setMapPosX((prev) => prev - defaultStepSize.current);
    } else if (target.id === "down" && mapPosY < 100) {
      setMapPosY((prev) => prev + defaultStepSize.current);
    } else if (target.id === "up" && mapPosY > 0) {
      setMapPosY((prev) => prev - defaultStepSize.current);
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
                backgroundPosition: `${mapPosX}% ${mapPosY}%`,
                backgroundSize: `${mapZoom * 100}%`,
              }}
            >
              {sprites &&
                sprites.map((sprite) => {
                  return (
                    <Sprite
                      posX={sprite.posX - mapPosX}
                      posY={sprite.posY - mapPosY}
                      key={sprite.name}
                      mapRect={mapRect}
                      controller={sprite.controller}
                      imgSrc={sprite.imgSrc}
                      setSprites={setSprites}
                      name={sprite.name}
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
