import React, { useState, useRef, useEffect } from "react";
import type { MouseEvent, MutableRefObject, SetStateAction } from "react";

import Sprite from "./Sprite";

import {
  FaArrowRight,
  FaArrowLeft,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa6";

import { GoZoomIn, GoZoomOut } from "react-icons/go";

type Spriteinfo = {
  name: string;
  posX: number;
  posY: number;
  height: string;
  width: string;
  imgSrc: string;
  controller: string;
};

type Maprect = {
  x: number;
  y: number;
  width: number;
  height: number;
  fullWidth: number;
  fullHeight: number;
};

type MapProps = {
  imgSrc: string;
  posX: number;
  posY: number;
  height: string;
  width: string;
  zoom: number;
  hasLoaded: boolean;
};

type Props = {
  mapRef: MutableRefObject<HTMLDivElement | null>;
  setSprites?: React.Dispatch<React.SetStateAction<Spriteinfo[]>>;
  sprites?: Spriteinfo[];
  mapRect: Maprect | null;
  map: MapProps;
  setMap: React.Dispatch<React.SetStateAction<MapProps>>;
};

const DungeonMap = ({
  setSprites,
  sprites,
  mapRect,
  mapRef,
  map,
  setMap,
}: Props) => {
  // Stepsize in percentage
  const defaultStepSize = useRef(100);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const tryLoad = new Image();
    tryLoad.src = map.imgSrc;
    tryLoad.onerror = () => {
      setImgError(true);
    };
  });

  const handleOnMapNav = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!mapRect) return;

    const target = event.currentTarget as HTMLButtonElement;

    if (
      target.id === "right" &&
      map.posX > -mapRect.fullWidth - defaultStepSize.current * 3
    ) {
      setMap((prev) => {
        return { ...prev, posX: prev.posX - defaultStepSize.current };
      });
    } else if (target.id === "left" && map.posX < 0) {
      setMap((prev) => {
        return { ...prev, posX: prev.posX + defaultStepSize.current };
      });
    } else if (
      target.id === "down" &&
      map.posY > -mapRect.fullHeight - defaultStepSize.current
    ) {
      setMap((prev) => {
        return { ...prev, posY: prev.posY - defaultStepSize.current };
      });
    } else if (target.id === "up" && map.posY < 0) {
      setMap((prev) => {
        return { ...prev, posY: prev.posY + defaultStepSize.current };
      });
    }
  };

  const handleOnMapZoom = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (e.currentTarget.id === "in" && map.zoom < 10) {
      setMap((prev) => {
        return { ...prev, zoom: prev.zoom + 1 };
      });
    } else if (e.currentTarget.id === "out" && map.zoom > 1) {
      setMap((prev) => {
        return { ...prev, zoom: prev.zoom - 1 };
      });
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    setMap((prev) => {
      return { ...prev, hasLoaded: true };
    });
  }, []);

  return (
    <>
      <div ref={mapRef} className={`${map.height} ${map.width} relative`}>
        {map.hasLoaded ? (
          <>
            {!imgError ? (
              <div
                className="h-full w-full"
                style={{
                  backgroundImage: `url(${map.imgSrc})`,
                  backgroundPosition: `${map.posX}px ${map.posY}px`,
                  backgroundSize: `${map.zoom * 100}%`,
                }}
              >
                {sprites?.map((sprite) => {
                  return (
                    <Sprite
                      posX={sprite.posX}
                      height={sprite.height}
                      width={sprite.width}
                      mapPosX={map.posX}
                      mapPosY={map.posY}
                      posY={sprite.posY}
                      key={sprite.name}
                      mapRect={mapRect}
                      controller={sprite.controller}
                      imgSrc={sprite.imgSrc}
                      setSprites={setSprites}
                      name={sprite.name}
                      sprites={sprites}
                    />
                  );
                })}
              </div>
            ) : (
              <div>error loading image</div>
            )}

            <div>
              <button onClick={handleOnMapNav} className="nav-btn" id="up">
                <FaArrowUp />
              </button>
              <button onClick={handleOnMapNav} className="nav-btn" id="down">
                <FaArrowDown />
              </button>
              <button onClick={handleOnMapNav} className="nav-btn" id="left">
                <FaArrowLeft />
              </button>
              <button onClick={handleOnMapNav} className="nav-btn" id="right">
                <FaArrowRight />
              </button>
              <button onClick={handleOnMapZoom} className="nav-btn" id="in">
                <GoZoomIn />
              </button>
              <button onClick={handleOnMapZoom} className="nav-btn" id="out">
                <GoZoomOut />
              </button>
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
