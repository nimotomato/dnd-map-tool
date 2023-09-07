import React, { useState, useRef, useEffect } from "react";
import type {
  ButtonHTMLAttributes,
  MouseEvent,
  MutableRefObject,
  SetStateAction,
} from "react";

import Sprite from "./Sprite";
import useTryLoadImg from "~/hooks/useTryLoadImg";
import { MapProps, Maprect, Game, Character } from "~/types";

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
  setSprites?: React.Dispatch<React.SetStateAction<Character[]>>;
  sprites?: Character[];
  mapRect: Maprect | null;
  map: MapProps;
  setMap: React.Dispatch<React.SetStateAction<MapProps>>;
  isDm: boolean;
  gameState: Game;
  setGameState: React.Dispatch<React.SetStateAction<Game>>;
  createMode: boolean;
  userTurnIndex?: number;
  setUserTurnIndex?: React.Dispatch<React.SetStateAction<number>>;
  userQueue?: Character[];
};

const DungeonMap = ({
  setSprites,
  sprites,
  mapRect,
  mapRef,
  map,
  isDm,
  setMap,
  gameState,
  setGameState,
  createMode,
  userTurnIndex,
  setUserTurnIndex,
  userQueue,
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

  const spriteFactory = () => {
    if (!sprites || !setSprites) return;

    if (createMode) {
      return sprites.map((sprite) => {
        return (
          <Sprite
            positionX={sprite.positionX}
            map={map}
            positionY={sprite.positionY}
            key={sprite.name}
            mapRect={mapRect}
            controller={sprite.controllerId}
            imgSrc={sprite.imgSrc}
            setSprites={setSprites}
            name={sprite.name}
            sprites={sprites}
            gameState={gameState}
            setGameState={setGameState}
            createMode={createMode}
          />
        );
      });
    } else {
      return sprites.map((sprite) => {
        return (
          <Sprite
            positionX={sprite.positionX}
            map={map}
            positionY={sprite.positionY}
            key={sprite.name}
            mapRect={mapRect}
            controller={sprite.controllerId}
            imgSrc={sprite.imgSrc}
            setSprites={setSprites}
            name={sprite.name}
            sprites={sprites}
            gameState={gameState}
            setGameState={setGameState}
            createMode={createMode}
            userTurnIndex={userTurnIndex}
            setUserTurnIndex={setUserTurnIndex}
            userQueue={userQueue}
          />
        );
      });
    }
  };

  return (
    <>
      <div
        ref={mapRef}
        className={`relative`}
        style={{
          height: `${25}rem`,
          width: `${25}rem`,
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
                {spriteFactory()}
              </div>
            ) : (
              <div>error loading image</div>
            )}
            {isDm && (
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
            )}
          </>
        ) : (
          <h1>Loading map</h1>
        )}
      </div>
    </>
  );
};

export default DungeonMap;
