import React, { useEffect, useRef, useState } from "react";

type Spriteinfo = {
  name: string;
  posX: number;
  posY: number;
  imgSrc: string;
  controller: string;
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Maprect = {
  x: number;
  y: number;
  width: number;
  height: number;
  fullWidth: number;
  fullHeight: number;
};

type Props = {
  posX: number;
  posY: number;
  height: string;
  width: string;
  controller: string;
  name: string;
  setSprites: React.Dispatch<React.SetStateAction<Spriteinfo[]>>;
  mapRect: Maprect | null;
  imgSrc: string;
  mapPosX: number;
  mapPosY: number;
  sprites: Spriteinfo[];
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
  mapPosX,
  mapPosY,
}: Props) => {
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
            posX: e.clientX - mapRect.x - offsetX - mapPosX,
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
            posY: e.clientY - mapRect.y - offsetY - mapPosY,
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

    if (posY + mapPosY < 0 || posY + mapPosY > mapRect.height) {
      setShow(false);
    } else {
      setShow(true);
    }
  }, [mapPosY]);

  // Make sprite not visible if outside of map
  useEffect(() => {
    if (!mapRect) return;

    if (posX + mapPosX < 0 || posX + mapPosX > mapRect.width) {
      setShow(false);
    } else {
      setShow(true);
    }
  }, [mapPosX]);

  return (
    <>
      <img
        draggable="false"
        ref={spriteRef}
        onMouseDown={handleMouseDown}
        id={name}
        src={`${imgSrc}`}
        alt="sprite"
        className={`absolute ${height} ${width} select-none ${
          show ? "visible" : "invisible"
        }`}
        style={{ top: `${posY + mapPosY}px`, left: `${posX + mapPosX}px` }}
      />
    </>
  );
};

export default Sprite;
