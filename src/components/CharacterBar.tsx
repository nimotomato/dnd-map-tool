import React from "react";
import type { Character, MapProps, Maprect } from "~/types";

type Props = {
  sprites: Character[];
  setMap: React.Dispatch<React.SetStateAction<MapProps>>;
  mapRect: Maprect | null;
  map: MapProps;
};

const CharacterBar = ({ sprites, setMap, mapRect, map }: Props) => {
  const handleOnClick = (e: React.MouseEvent) => {
    e.preventDefault();

    sprites.map((sprite) => {
      if (e.currentTarget.id !== sprite.name || !mapRect) return; // Find correct sprite

      // TO DO:
      // Check we are within bounds of map, eg 0.0 shouldnt be centered, but stay bound to left corner
      // Calculate relative positioning of map
      const newX = -sprite.positionX + mapRect.width / 2;
      const newY = -sprite.positionY + mapRect.height / 2;
      setMap((prevMap) => ({ ...prevMap, positionX: newX, positionY: newY }));
    });
  };

  return (
    <div className="flex w-20 flex-col">
      {sprites?.map((sprite) => {
        return (
          <div className="m-2" key={sprite.name}>
            <img
              id={sprite.name}
              onClick={handleOnClick}
              className="h-14 w-14"
              src={sprite.imgSrc}
            />
            <p>{sprite.name}</p>
            <p>{`Initiative: ${sprite.initiative}`}</p>
          </div>
        );
      })}
    </div>
  );
};

export default CharacterBar;
