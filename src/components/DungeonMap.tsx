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
import debounce from "lodash/debounce";

import {
  FaArrowRight,
  FaArrowLeft,
  FaArrowUp,
  FaArrowDown,
  FaPlus,
  FaMinus,
} from "react-icons/fa6";
import { api } from "~/utils/api";

import { GoZoomIn, GoZoomOut } from "react-icons/go";

type Props = {
  mapRef: MutableRefObject<HTMLDivElement | null>;
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
  const { mutate, error, isError } = api.game.patchMapPosition.useMutation();
  const delay = 500;

  // Store debounced function in ref to improve stability across lifecycles
  const debouncedUpdateMapPositionRef = useRef(debounce(mutate, delay));

  useEffect(() => {
    console.log(map);
  }, [map]);

  const handleOnMapNav = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!mapRect) return;

    const target = event.currentTarget as HTMLButtonElement;
    const lazyConstantX = 3;
    const lazyConstantY = 1.8;

    if (
      target.id === "right" &&
      map.positionX >
        -mapRect.fullWidth - defaultStepSize.current * lazyConstantX
    ) {
      setMap((prev) => {
        // if (!createMode) {
        //   debouncedUpdateMapPositionRef.current({
        //     mapPosY: prev.posY,
        //     mapPosX: prev.posX - defaultStepSize.current,
        //     gameId: gameState.id,
        //   });
        // }
        return { ...prev, positionX: prev.positionX - defaultStepSize.current };
      });
    } else if (target.id === "left" && map.positionX < 0) {
      setMap((prev) => {
        // if (!createMode) {
        //   debouncedUpdateMapPositionRef.current({
        //     mapPosY: prev.posY,
        //     mapPosX: prev.posX + defaultStepSize.current,
        //     gameId: gameState.id,
        //   });
        // }
        return { ...prev, positionX: prev.positionX + defaultStepSize.current };
      });
    } else if (
      target.id === "down" &&
      map.positionY >
        -mapRect.fullHeight - defaultStepSize.current * lazyConstantY
    ) {
      setMap((prev) => {
        // if (!createMode) {
        //   debouncedUpdateMapPositionRef.current({
        //     mapPosY: prev.posY - defaultStepSize.current,
        //     mapPosX: prev.posX,
        //     gameId: gameState.id,
        //   });
        // }
        return { ...prev, positionY: prev.positionY - defaultStepSize.current };
      });
    } else if (target.id === "up" && map.positionY < 0) {
      setMap((prev) => {
        // if (!createMode) {
        //   debouncedUpdateMapPositionRef.current({
        //     mapPosY: prev.posY + defaultStepSize.current,
        //     mapPosX: prev.posX,
        //     gameId: gameState.id,
        //   });
        // }
        return { ...prev, positionY: prev.positionY + defaultStepSize.current };
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
    if (!sprites) return;

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
            id={sprite.characterId}
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
            id={sprite.characterId}
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
                  backgroundPosition: `${map.positionX}px ${map.positionY}px`,
                  backgroundSize: `${map.zoom * 100}%`,
                }}
              >
                {spriteFactory()}
              </div>
            ) : (
              <div>error loading image</div>
            )}
            <div>
              {isDm && (
                <>
                  <button onClick={handleOnMapNav} className="nav-btn" id="up">
                    <FaArrowUp />
                  </button>
                  <button
                    onClick={handleOnMapNav}
                    className="nav-btn"
                    id="down"
                  >
                    <FaArrowDown />
                  </button>
                  <button
                    onClick={handleOnMapNav}
                    className="nav-btn"
                    id="left"
                  >
                    <FaArrowLeft />
                  </button>
                  <button
                    onClick={handleOnMapNav}
                    className="nav-btn"
                    id="right"
                  >
                    <FaArrowRight />
                  </button>
                </>
              )}
              {createMode && (
                <>
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
                </>
              )}
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
