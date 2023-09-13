import React, { useRef, useEffect } from "react";
import type { Character, MapProps, Maprect, Game } from "~/types";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import debounce from "lodash/debounce";

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

  // Store debounced function in ref to ensure stability across lifecycle
  const debouncedKillCharacterRef = useRef(debounce(mutate, 100));

  const handleOnClick = (e: React.MouseEvent) => {
    e.preventDefault();

    gameState.characters.map((sprite) => {
      if (e.currentTarget.id !== sprite.characterId || !mapRect) return; // Find correct sprite

      // TO DO:
      // Check we are within bounds of map, eg 0.0 shouldnt be centered, but stay bound to left corner
      // Calculate relative positioning of map
      const newX = -sprite.positionX + mapRect.width / 2;
      const newY = -sprite.positionY + mapRect.height / 2;
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
    <div className="flex w-20 flex-col">
      {gameState.characters?.map((sprite) => {
        return (
          <div className="m-2" key={sprite.characterId}>
            <img
              id={sprite.characterId}
              onClick={handleOnClick}
              className="h-14 w-14"
              src={sprite.imgSrc}
            />
            <p>{sprite.name}</p>

            {!createMode && (
              <>
                <p>{`Initiative: ${sprite.initiative}`}</p>
                <button
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
