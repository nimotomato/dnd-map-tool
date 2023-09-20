import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Sprite from "./Sprite";
import useTryLoadImg from "~/hooks/useTryLoadImg";
import {
  FaArrowRight,
  FaArrowLeft,
  FaArrowUp,
  FaArrowDown,
  FaPlus,
  FaMinus,
} from "react-icons/fa6";
import { GoZoomIn, GoZoomOut } from "react-icons/go";

import { MapProps, Maprect, Game, Character } from "~/types";
import type { MouseEvent, MutableRefObject } from "react";

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
  userQueue?: Character[];
  step?: number;
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
  userQueue,
  step,
}: Props) => {
  const session = useSession();
  const currentUser = session.data?.user;
  // TO DO: Stepsize in percentage
  const defaultStepSize = useRef(100);
  const playerSpriteRef = useRef<Character | null>(null);
  const imgError = useTryLoadImg(gameState.map.imgSrc);

  useEffect(() => {
    if (!currentUser) return;

    if (!isDm) {
      gameState.characters.map((sprite) => {
        if (sprite.controllerId !== currentUser.id) return;

        playerSpriteRef.current = sprite;
        console.log("My sprite is:", playerSpriteRef.current);
      });
    }
  }, [gameState.dungeonMaster]);

  const handleOnMapNav = (event: MouseEvent<HTMLButtonElement>) => {
    // TO DO: DRY this and also leash distance is static i.e. not relative to map dimensions
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
      // If no sprites, no leash OR if DM no leash
      if (
        !sprites ||
        (sprites && sprites.length < 1) ||
        currentUser?.id === gameState.dungeonMaster
      ) {
        setMap((prev) => {
          return {
            ...prev,
            positionX: prev.positionX - defaultStepSize.current,
          };
        });

        return;
      }

      // Cycle through sprites to find the one controlled by player
      sprites?.map((sprite) => {
        if (sprite.controllerId !== currentUser?.id) return;
        // Calculate leash point X to the right
        const leashPoint = sprite.prevPositionX + gameState.leashDistance;

        if (leashPoint < Math.abs(map.positionX) + mapRect.width / 2) {
          return;
        }

        setMap((prev) => {
          return {
            ...prev,
            positionX: prev.positionX - defaultStepSize.current,
          };
        });
      });
    } else if (target.id === "left" && map.positionX < 0) {
      // If no sprites, no leash OR if DM no leash
      if (
        !sprites ||
        (sprites && sprites.length < 1) ||
        currentUser?.id === gameState.dungeonMaster
      ) {
        setMap((prev) => {
          return {
            ...prev,
            positionX: prev.positionX + defaultStepSize.current,
          };
        });

        return;
      }

      // Cycle through sprites to find the one controlled by player
      sprites?.map((sprite) => {
        if (sprite.controllerId !== currentUser?.id) return;
        // Calculate leash point X to the right
        const leashPoint = sprite.prevPositionX - gameState.leashDistance;

        if (leashPoint > Math.abs(map.positionX - mapRect.width / 2)) {
          return;
        }

        setMap((prev) => {
          return {
            ...prev,
            positionX: prev.positionX + defaultStepSize.current,
          };
        });
      });
    } else if (
      target.id === "down" &&
      map.positionY >
        -mapRect.fullHeight - defaultStepSize.current * lazyConstantY
    ) {
      // If no sprites, no leash OR DM no leash
      if (
        !sprites ||
        (sprites && sprites.length < 1) ||
        currentUser?.id === gameState.dungeonMaster
      ) {
        setMap((prev) => {
          return {
            ...prev,
            positionY: prev.positionY - defaultStepSize.current,
          };
        });

        return;
      }

      // Cycle through sprites to find the one controlled by player
      sprites?.map((sprite) => {
        if (sprite.controllerId !== currentUser?.id) return;
        // Calculate leash point X to the right
        const leashPoint = sprite.prevPositionY - gameState.leashDistance;

        if (leashPoint < Math.abs(map.positionY + mapRect.height / 2)) {
          return;
        }

        setMap((prev) => {
          return {
            ...prev,
            positionY: prev.positionY - defaultStepSize.current,
          };
        });
      });
    } else if (target.id === "up" && map.positionY < 0) {
      // If no sprites, no leash OR if DM no leash
      if (
        !sprites ||
        (sprites && sprites.length < 1) ||
        currentUser?.id === gameState.dungeonMaster
      ) {
        setMap((prev) => {
          return {
            ...prev,
            positionY: prev.positionY + defaultStepSize.current,
          };
        });

        return;
      }

      // Cycle through sprites to find the one controlled by player
      sprites?.map((sprite) => {
        if (sprite.controllerId !== currentUser?.id) return;
        // Calculate leash point X to the right
        const leashPoint = sprite.prevPositionY - gameState.leashDistance;

        if (leashPoint > Math.abs(map.positionY - mapRect.height / 2)) {
          return;
        }

        setMap((prev) => {
          return {
            ...prev,
            positionY: prev.positionY + defaultStepSize.current,
          };
        });
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
            imgSrc={sprite.imgSrc}
            id={sprite.characterId}
            sprites={sprites}
            gameState={gameState}
            setGameState={setGameState}
            createMode={createMode}
            zoomCoefficient={zoomCoefficient}
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
            imgSrc={sprite.imgSrc}
            id={sprite.characterId}
            sprites={sprites}
            gameState={gameState}
            setGameState={setGameState}
            createMode={createMode}
            userTurnIndex={userTurnIndex}
            userQueue={userQueue}
            zoomCoefficient={zoomCoefficient}
          />
        );
      });
    }
  };

  const [zoomCoefficient, setZoomCoefficient] = useState({ x: 1, y: 1 });

  const handleMapZoom = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!mapRect) return;

    let newZoom: number;

    if (e.currentTarget.id === "zoomIn") {
      setGameState((prevState) => {
        newZoom = prevState.map.zoom + 1;
        return {
          ...prevState,
          map: { ...prevState.map, zoom: newZoom },
        };
      });
    } else if (e.currentTarget.id === "zoomOut") {
      setGameState((prevState) => {
        newZoom = prevState.map.zoom - 1;
        return {
          ...prevState,
          map: { ...prevState.map, zoom: newZoom },
        };
      });
    }

    // Update zoomCoefficient right after updating map state
    setZoomCoefficient((prevCoefficient) => {
      // Use newZoom and mapRect to calculate the new coefficient
      const defaultZoom = 6;
      const originalX = mapRect.fullWidth * defaultZoom * 100;
      const originalY = mapRect.fullHeight * defaultZoom * 100;
      const nextX = mapRect.fullWidth * newZoom * 100;
      const nextY = mapRect.fullHeight * newZoom * 100;

      return {
        x: nextX / originalX,
        y: nextY / originalY,
      };
    });
  };

  return (
    <>
      <div
        ref={mapRef}
        className={`relative`}
        style={{
          height: `${45}rem`,
          width: `${45}rem`,
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
                  backgroundSize: `${gameState.map.zoom * 100}%`,
                }}
              >
                {spriteFactory()}
              </div>
            ) : (
              <div>error loading image</div>
            )}
            <div className="flex">
              <button
                onClick={handleOnMapNav}
                className="border-3 m-1 rounded border border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 hover:bg-stone-700"
                id="up"
              >
                <FaArrowUp />
              </button>
              <button
                onClick={handleOnMapNav}
                className="border-3 m-1 rounded border border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 hover:bg-stone-700"
                id="down"
              >
                <FaArrowDown />
              </button>
              <button
                onClick={handleOnMapNav}
                className="border-3 m-1 rounded border border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 hover:bg-stone-700"
                id="left"
              >
                <FaArrowLeft />
              </button>
              <button
                onClick={handleOnMapNav}
                className="border-3 m-1 rounded border border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 hover:bg-stone-700"
                id="right"
              >
                <FaArrowRight />
              </button>
              {createMode &&
                (step === 0 ? (
                  <>
                    <button
                      onClick={handleMapZoom}
                      className="border-3 m-1 rounded border border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 hover:bg-stone-700"
                      id="zoomIn"
                    >
                      <GoZoomIn />
                    </button>
                    <button
                      onClick={handleMapZoom}
                      className="border-3 m-1 rounded border border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 hover:bg-stone-700"
                      id="zoomOut"
                    >
                      <GoZoomOut />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleOnSpritesizeChange}
                      className="border-3 m-1 rounded border border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 hover:bg-stone-700"
                      id="increase"
                    >
                      <FaPlus />
                    </button>
                    <button
                      onClick={handleOnSpritesizeChange}
                      className="border-3 m-1 rounded border border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 hover:bg-stone-700"
                      id="decrease"
                    >
                      <FaMinus />
                    </button>
                  </>
                ))}
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
