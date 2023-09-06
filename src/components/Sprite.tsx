import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import { Spriteinfo, Maprect, MapProps, Game } from "~/types";

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  posX: number;
  posY: number;
  height: number;
  width: number;
  controller: string;
  name: string;
  setSprites: React.Dispatch<React.SetStateAction<Spriteinfo[]>>;
  mapRect: Maprect | null;
  imgSrc: string;
  map: MapProps;
  sprites: Spriteinfo[];
  gameState: Game;
  setGameState: React.Dispatch<React.SetStateAction<Game>>;
};
const Sprite = ({
  mapRect,
  setSprites,
  posX,
  posY,
  height,
  width,
  name,
  controller,
  imgSrc,
  map,
  gameState,
  setGameState,
}: Props) => {
  const session = useSession();
  const currentUser = session.data?.user;

  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const [spriteRect, setSpriteRect] = useState<Rect | null>(null);
  const [show, setShow] = useState(true);

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

    setSprites((prev) => {
      return prev.map((sprite) => ({
        ...sprite,
        height: (mapRect.height * gameState.map.spriteSize) / 100,
        width: (mapRect.width * gameState.map.spriteSize) / 100,
      }));
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
          if (sprite.name !== name) return sprite;

          return {
            ...sprite,
            posX: e.clientX - mapRect.x - offsetX - map.posX,
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
          if (sprite.name !== name) return sprite;

          return {
            ...sprite,
            posY: e.clientY - mapRect.y - offsetY - map.posY,
          };
        });
      });
    }
  };

  const handleMouseUp = () => {
    // TO DO: Send new sprite pos to DB
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

    if (posY + map.posY < 0 || posY + map.posY > mapRect.height) {
      setShow(false);
    } else {
      setShow(true);
    }
  }, [map.posY]);

  // Make sprite not visible if outside of map
  useEffect(() => {
    if (!mapRect) return;

    if (posX + map.posX < 0 || posX + map.posX > mapRect.width) {
      setShow(false);
    } else {
      setShow(true);
    }
  }, [map.posX]);

  return (
    <>
      <img
        draggable="false"
        ref={spriteRef}
        onMouseDown={handleMouseDown}
        id={name}
        src={`${imgSrc}`}
        alt="sprite"
        className={`absolute select-none ${show ? "visible" : "invisible"}`}
        style={{
          height: `${height}px`,
          width: `${width}px`,
          top: `${posY + map.posY}px`,
          left: `${posX + map.posX}px`,
        }}
      />
    </>
  );
};

export default Sprite;
