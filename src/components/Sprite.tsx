import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

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

type Props = {
  posX: number;
  posY: number;
  controller: string;
  name: string;
  setSprites: React.Dispatch<React.SetStateAction<Spriteinfo[]>>;
  mapRect: Rect | null;
  imgSrc: string;
};
const Sprite = ({
  mapRect,
  setSprites,
  posX,
  posY,
  name,
  controller,
  imgSrc,
}: Props) => {
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const [spriteRect, setSpriteRect] = useState<Rect | null>(null);

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

  const handleMouseMove = (e) => {
    if (!mapRect) return;
    e.preventDefault();

    if (
      e.clientX - offsetX - mapRect.x > 0 &&
      e.clientX + spriteRect?.width - offsetX < mapRect.x + mapRect.width
    ) {
      setSprites((prevSprites) => {
        return prevSprites.map((sprite) => {
          if (sprite.name !== name) return sprite;

          return { ...sprite, posX: e.clientX - mapRect.x - offsetX };
        });
      });
    }

    if (
      e.clientY - offsetY - mapRect.y > 0 &&
      e.clientY + spriteRect?.height - offsetY < mapRect.y + mapRect.height
    ) {
      setSprites((prevSprites) => {
        return prevSprites.map((sprite) => {
          if (sprite.name !== name) return sprite;

          return { ...sprite, posY: e.clientY - mapRect.y - offsetY };
        });
      });
    }
  };

  const handleMouseUp = () => {
    // TO DO: Send new sprite pos to DB
  };

  const handleDocumentMouseUp = () => {
    handleMouseUp();

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleDocumentMouseUp);
  };

  const handleMouseDown = (e) => {
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

  return (
    <>
      <img
        draggable="false"
        ref={spriteRef}
        onMouseDown={handleMouseDown}
        id={name}
        src={`${imgSrc}`}
        alt="sprite"
        className={`absolute h-9 w-9 select-none`}
        style={{ top: `${posY}px`, left: `${posX}px` }}
      />
    </>
  );
};

export default Sprite;
