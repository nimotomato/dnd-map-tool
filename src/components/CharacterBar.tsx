import React, { useRef } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import debounce from "lodash/debounce";

import type { MapProps, Maprect, Game } from "~/types";

type Props = {
  gameState: Game;
  setMap: React.Dispatch<React.SetStateAction<MapProps>>;
  mapRect: Maprect | null;
  map: MapProps;
  setGameState: React.Dispatch<React.SetStateAction<Game>>;
  createMode: boolean;
};

const CharacterBar = ({
  gameState,
  setMap,
  mapRect,
  setGameState,
  createMode,
}: Props) => {
  const session = useSession();
  const currentUser = session.data?.user;
  const { mutate, error, isError } = api.character.patchIsDead.useMutation();
  const debouncedKillCharacterRef = useRef(debounce(mutate, 100)); // Store debounced function in ref to ensure stability across lifecycle

  const handleOnClick = (e: React.MouseEvent) => {
    e.preventDefault();

    gameState.characters.map((sprite) => {
      if (e.currentTarget.id !== sprite.characterId || !mapRect) return; // Find correct sprite

      // Calculate relative positioning of map
      let newX = -sprite.positionX + mapRect.width / 2;
      let newY = -sprite.positionY + mapRect.height / 2;

      // Contain bounds of map
      if (newX > 0) newX = 0;
      if (newY > 0) newY = 0;

      // Lazy divider
      const lazyConstantX = 1.3;
      const lazyConstantY = 1.2;
      if (newX < -mapRect.fullWidth)
        newX = -sprite.positionX + mapRect.width / lazyConstantX;
      if (newY < -mapRect.fullWidth)
        newY = -sprite.positionY + mapRect.height / lazyConstantY;

      setMap((prevMap) => ({ ...prevMap, positionX: newX, positionY: newY }));
    });
  };

  // SET IS DEAD
  const handleSetDeathStatus = (e: React.MouseEvent, id: string) => {
    e.preventDefault();

    // Only DM can set someone as dead
    if (gameState.dungeonMaster !== currentUser?.id || gameState.isPaused)
      return;

    setGameState((prevState) => {
      const updatedCharacters = prevState.characters.map((sprite) => {
        if (id !== sprite.characterId) return sprite; // Find correct sprite

        const deathStatus = !sprite.isDead;

        debouncedKillCharacterRef.current({
          characterId: sprite.characterId,
          gameId: gameState.id,
          isDead: deathStatus,
        });

        return { ...sprite, isDead: deathStatus };
      });

      return { ...prevState, characters: updatedCharacters };
    });
  };

  return (
    <div className="mr-2 flex h-full w-28 flex-col overflow-y-auto text-sm text-slate-200">
      {gameState.characters
        ?.filter((sprite) => {
          if (currentUser?.id === gameState?.dungeonMaster) {
            return sprite;
          } else if (
            currentUser?.id !== gameState?.dungeonMaster &&
            sprite.controllerId !== gameState?.dungeonMaster
          ) {
            return sprite;
          }
        })
        .map((sprite) => {
          return (
            <div
              className=" my-2 flex w-28 flex-col items-center justify-center rounded border-2 border-stone-600 bg-stone-900"
              key={sprite.characterId}
            >
              <img
                id={sprite.characterId}
                onClick={handleOnClick}
                className="my-2 h-16 w-16 rounded border-2 border-stone-600 bg-stone-900"
                src={sprite.imgSrc}
              />
              <p>{sprite.name}</p>
              {!createMode && (
                <p className="w-fit">{`Initiative: ${sprite.initiative}`}</p>
              )}

              {!createMode && currentUser?.id === gameState?.dungeonMaster && (
                <>
                  <button
                    className="z-10 m-1 rounded border-2 border-solid border-slate-400 bg-stone-600 px-2 text-sm hover:bg-stone-700"
                    id={sprite.characterId}
                    onClick={(e) => handleSetDeathStatus(e, sprite.characterId)}
                  >{`${sprite.isDead ? "Resurrect" : "Kill"}`}</button>
                </>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default CharacterBar;
