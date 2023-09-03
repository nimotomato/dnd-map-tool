import React, { useState, useRef, useEffect } from "react";
import type {
  ButtonHTMLAttributes,
  MouseEvent,
  MutableRefObject,
  SetStateAction,
} from "react";

import Sprite from "./Sprite";
import useTryLoadImg from "~/hooks/useTryLoadImg";
import { Spriteinfo, MapProps, Maprect, Game } from "~/types";

import {
  FaArrowRight,
  FaArrowLeft,
  FaArrowUp,
  FaArrowDown,
  FaPlus,
  FaMinus,
} from "react-icons/fa6";

import { GoZoomIn, GoZoomOut } from "react-icons/go";

type Props = {
  mapRef: MutableRefObject<HTMLDivElement | null>;
  setSprites?: React.Dispatch<React.SetStateAction<Spriteinfo[]>>;
  sprites?: Spriteinfo[];
  mapRect: Maprect | null;
  map: MapProps;
  setMap: React.Dispatch<React.SetStateAction<MapProps>>;
  gameState: Game;
  setGameState: React.Dispatch<React.SetStateAction<Game>>;
};

const DungeonMap = ({
  setSprites,
  sprites,
  mapRect,
  mapRef,
  map,
  setMap,
  gameState,
  setGameState,
}: Props) => {
  // Stepsize in percentage
  const defaultStepSize = useRef(100);
  const imgError = useTryLoadImg(gameState.map.imgSrc);

  const handleOnMapNav = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!mapRect) return;

    const target = event.currentTarget as HTMLButtonElement;

    if (
      target.id === "right" &&
      map.posX > -mapRect.fullWidth - defaultStepSize.current * 3
    ) {
      setMap((prev) => {
        return { ...prev, posX: prev.posX - defaultStepSize.current };
      });
    } else if (target.id === "left" && map.posX < 0) {
      setMap((prev) => {
        return { ...prev, posX: prev.posX + defaultStepSize.current };
      });
    } else if (
      target.id === "down" &&
      map.posY > -mapRect.fullHeight - defaultStepSize.current
    ) {
      setMap((prev) => {
        return { ...prev, posY: prev.posY - defaultStepSize.current };
      });
    } else if (target.id === "up" && map.posY < 0) {
      setMap((prev) => {
        return { ...prev, posY: prev.posY + defaultStepSize.current };
      });
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    setMap((prev) => {
      return { ...prev, hasLoaded: true };
    });
  }, []);

  const handleOnSpritesizeChange = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (e.currentTarget.id === "increase") {
      setGameState((prev) => ({
        ...prev,
        map: { ...prev.map, spriteSize: prev.map.spriteSize + 1 },
      }));
    } else if (e.currentTarget.id === "decrease") {
      setGameState((prev) => ({
        ...prev,
        map: { ...prev.map, spriteSize: prev.map.spriteSize - 1 },
      }));
    }
  };

  return (
    <>
      <div
        ref={mapRef}
        className={`relative`}
        style={{
          height: `${map.height}rem`,
          width: `${map.width}rem`,
        }}
      >
        {map.hasLoaded ? (
          <>
            {!imgError ? (
              <div
                className="h-full w-full"
                style={{
                  backgroundImage: `url(${gameState.map.imgSrc})`,
                  backgroundPosition: `${map.posX}px ${map.posY}px`,
                  backgroundSize: `${map.zoom * 100}%`,
                }}
              >
                {setSprites &&
                  sprites?.map((sprite) => {
                    return (
                      <Sprite
                        posX={sprite.posX}
                        height={sprite.height}
                        width={sprite.width}
                        map={map}
                        posY={sprite.posY}
                        key={sprite.name}
                        mapRect={mapRect}
                        controller={sprite.controller}
                        imgSrc={sprite.imgSrc}
                        setSprites={setSprites}
                        name={sprite.name}
                        sprites={sprites}
                        gameState={gameState}
                        setGameState={setGameState}
                      />
                    );
                  })}
              </div>
            ) : (
              <div>error loading image</div>
            )}

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

              <button
                onClick={handleOnSpritesizeChange}
                className="nav-btn"
                id="increase"
              >
                <FaPlus />
              </button>
              <button
                onClick={handleOnSpritesizeChange}
                className="nav-btn"
                id="decrease"
              >
                <FaMinus />
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
