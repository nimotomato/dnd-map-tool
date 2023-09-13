import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import debounce from "lodash/debounce";

import { Maprect, MapProps, Game, Character } from "~/types";

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  positionX: number;
  positionY: number;
  controller: string;
  id: string;
  mapRect: Maprect | null;
  imgSrc: string;
  map: MapProps;
  sprites: Character[];
  gameState: Game;
  setGameState: React.Dispatch<React.SetStateAction<Game>>;
  createMode: boolean;
  userTurnIndex?: number;
  setUserTurnIndex?: React.Dispatch<React.SetStateAction<number>>;
  userQueue?: Character[];
};
const Sprite = ({
  mapRect,
  positionX,
  positionY,
  id,
  controller,
  imgSrc,
  map,
  gameState,
  setGameState,
  sprites,
  createMode,
  userTurnIndex,
  setUserTurnIndex,
  userQueue,
}: Props) => {
  const session = useSession();
  const currentUser = session.data?.user;

  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const [spriteRect, setSpriteRect] = useState<Rect | null>(null);
  const [show, setShow] = useState(true);
  const [dimensions, setDimensions] = useState({ height: 0, width: 0 });
  const [isDead, setIsDead] = useState(false);

  useEffect(() => {
    sprites.map((sprite) => {
      if (sprite.characterId !== id) return;

      setIsDead(sprite.isDead);
    });
  }, [sprites]);

  // Prepare update query
  const { mutate, error, isError } =
    api.character.putCharacterInGame.useMutation();

  // Prepare debouncer
  const debounceTime = 50;

  // Store in ref to improve stability over lifecycles
  const debouncedUpdateCharacterRef = useRef(debounce(mutate, debounceTime));

  // Send sprite data to db
  useEffect(() => {
    gameState.characters.map((sprite) => {
      if (sprite.characterId !== id) return;

      debouncedUpdateCharacterRef.current({ ...sprite, gameId: gameState.id });
    });

    return () => {
      debouncedUpdateCharacterRef.current.cancel();
    };
  }, [gameState.characters]);

  if (isError) {
    console.error("An error occurred:", error);
  }

  useEffect(() => {
    if (spriteRef.current) {
      const boundingClient = spriteRef.current.getBoundingClientRect();

      setSpriteRect({
        x: boundingClient.x,
        y: boundingClient.y,
        width: boundingClient.width,
        height: boundingClient.height,
      });
    }
  }, []);

  // Handle sprite sizes
  useEffect(() => {
    if (!mapRect) return;

    setDimensions({
      height: (mapRect.height * gameState.map.spriteSize) / 100,
      width: (mapRect.width * gameState.map.spriteSize) / 100,
    });
  }, [mapRect?.height, mapRect?.width, gameState.map]);

  const handleMouseMove = (e: MouseEvent) => {
    if (!mapRect || !spriteRect) return;
    e.preventDefault();

    // Local movement
    if (
      e.clientX - offsetX - mapRect.x > 0 &&
      e.clientX + spriteRect.width - offsetX < mapRect.x + mapRect.width
    ) {
      setGameState((prevGameState) => {
        const newCharacterState = prevGameState.characters.map((character) => {
          if (character.characterId !== id) return character;

          return {
            ...character,
            positionX: e.clientX - mapRect.x - offsetX - map.posX,
          };
        });

        const newGameState = {
          ...prevGameState,
          characters: newCharacterState,
        };

        return newGameState;
      });
    }

    if (
      e.clientY - offsetY - mapRect.y > 0 &&
      e.clientY + spriteRect.height - offsetY < mapRect.y + mapRect.height
    ) {
      setGameState((prevGameState) => {
        const newCharacterState = prevGameState.characters.map((character) => {
          if (character.characterId !== id) return character;

          return {
            ...character,
            positionY: e.clientY - mapRect.y - offsetY - map.posY,
          };
        });

        const newGameState = {
          ...prevGameState,
          characters: newCharacterState,
        };

        return newGameState;
      });
    }

    // // Send movement to database
    // if (!createMode) {
    //   if (!userQueue || userTurnIndex === undefined || !currentUser) {
    //     return;
    //   }
    //   if (userQueue[userTurnIndex]?.controllerId !== currentUser.id) {
    //     // Check current user turn
    //     return;
    //   }

    //   if (
    //     e.clientX - offsetX - mapRect.x > 0 &&
    //     e.clientX + spriteRect.width - offsetX < mapRect.x + mapRect.width
    //   ) {
    //     sprites.map((sprite) => {
    //       if (sprite.characterId !== id) return;

    //       const newSprite = {
    //         ...sprite,
    //         positionX: e.clientX - mapRect.x - offsetX - map.posX,
    //       };

    //       debouncedUpdateCharacterRef.current({
    //         ...newSprite,
    //         gameId: gameState.id,
    //       });
    //     });
    //   }

    //   if (
    //     e.clientY - offsetY - mapRect.y > 0 &&
    //     e.clientY + spriteRect.height - offsetY < mapRect.y + mapRect.height
    //   ) {
    //     sprites.map((sprite) => {
    //       if (sprite.characterId !== id) return;

    //       const newSprite = {
    //         ...sprite,
    //         positionY: e.clientY - mapRect.y - offsetY - map.posY,
    //       };

    //       debouncedUpdateCharacterRef.current({
    //         ...newSprite,
    //         gameId: gameState.id,
    //       });
    //     });
    //   }
    // }
  };

  // TO DO: Add animation to this
  const handleDocumentMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleDocumentMouseUp);
  };

  const handleMouseDown = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>
  ) => {
    if (!spriteRect) return;

    if (!createMode) {
      if (gameState.isPaused) {
        return;
      }

      if (!userQueue || userTurnIndex === undefined || !currentUser) {
        return;
      }

      if (userQueue[userTurnIndex]?.controllerId !== currentUser.id) {
        return;
      }
      // Make sure controller only moves the correct sprite...
      let thisSprite = false;

      sprites.map((sprite) => {
        if (sprite.characterId !== id) return;

        if (sprite.characterId === userQueue[userTurnIndex]?.characterId) {
          thisSprite = true;
        }
      });

      if (!thisSprite) {
        return;
      }
    }

    if (spriteRef.current) {
      const boundingClient = spriteRef.current.getBoundingClientRect();

      setSpriteRect({
        x: boundingClient.x,
        y: boundingClient.y,
        width: boundingClient.width,
        height: boundingClient.height,
      });

      // TO DO: This calculation is incorrect
      setOffsetX(e.clientX - boundingClient.x);
      setOffsetY(e.clientY - boundingClient.y);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleDocumentMouseUp);
  };

  // Make sprite not visible if outside of map
  //  THis needs a debounce effect
  useEffect(() => {
    if (!mapRect) return;

    if (positionY + map.posY < 0 || positionY + map.posY > mapRect.height) {
      setShow(false);
    } else {
      setShow(true);
    }

    if (positionX + map.posX < 0 || positionX + map.posX > mapRect.width) {
      setShow(false);
    } else {
      setShow(true);
    }
  }, [map.posY, map.posX]);

  return (
    <>
      <img
        draggable="false"
        ref={spriteRef}
        onMouseDown={handleMouseDown}
        id={id}
        src={`${imgSrc}`}
        alt="sprite"
        className={`absolute select-none ${show ? "visible" : "invisible"} ${
          isDead ? "rotate-90" : "rotate-0"
        }`}
        style={{
          height: `${dimensions.height}px`,
          width: `${dimensions.width}px`,
          top: `${positionY + map.posY}px`,
          left: `${positionX + map.posX}px`,
        }}
      />
    </>
  );
};

export default Sprite;
