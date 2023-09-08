import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";

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
  setSprites: React.Dispatch<React.SetStateAction<Character[]>>;
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
  setSprites,
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

    if (
      e.clientX - offsetX - mapRect.x > 0 &&
      e.clientX + spriteRect.width - offsetX < mapRect.x + mapRect.width
    ) {
      setSprites((prevSprites) => {
        return prevSprites.map((sprite) => {
          if (sprite.characterId !== id) return sprite;

          return {
            ...sprite,
            positionX: e.clientX - mapRect.x - offsetX - map.posX,
          };
        });
      });
    }

    if (
      e.clientY - offsetY - mapRect.y > 0 &&
      e.clientY + spriteRect.height - offsetY < mapRect.y + mapRect.height
    ) {
      setSprites((prevSprites) => {
        return prevSprites.map((sprite) => {
          if (sprite.characterId !== id) return sprite;

          return {
            ...sprite,
            positionY: e.clientY - mapRect.y - offsetY - map.posY,
          };
        });
      });
    }
  };

  // Prepare update query
  const updateCharacter = api.character.putCharacterInGame.useMutation();

  const handleMouseUp = () => {
    // Send new sprite pos to DB
    if (!createMode) {
      if (!userQueue || !userTurnIndex || !currentUser) {
        return;
      }
      if (userQueue[userTurnIndex]?.controllerId !== currentUser.id) {
        return;
      }
    }

    sprites.map((sprite) => {
      if (sprite.characterId !== id) return;

      updateCharacter.mutate({ ...sprite, gameId: gameState.id });
    });
  };

  // TO DO: Add animation to this
  const handleDocumentMouseUp = () => {
    handleMouseUp();

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
        className={`absolute select-none ${show ? "visible" : "invisible"}`}
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
