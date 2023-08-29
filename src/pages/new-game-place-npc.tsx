import React, {
  MouseEvent as ReactMouseEvent,
  useRef,
  useState,
  useEffect,
} from "react";
import Head from "next/head";

import DungeonMap from "~/components/DungeonMap";
import CharacterBar from "~/components/CharacterBar";
import useGetMapRect from "../hooks/useGetMapRect";

import useTryLoadImg from "~/hooks/useTryLoadImg";
import { Spriteinfo, MapProps } from "~/types";
const defaultMap = "/img/dungeonmap.jpg";

const PlaceNpc = () => {
  const [sprites, setSprites] = useState<Array<Spriteinfo>>([]);
  // TO DO: Condense states into obj

  const [map, setMap] = useState<MapProps>({
    imgSrc: defaultMap,
    posX: 0,
    posY: 0,
    height: 25,
    width: 25,
    zoom: 6,
    hasLoaded: false,
  });

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapRect = useGetMapRect(map.imgSrc, mapRef);

  // SPRITE STUFF

  const [NPCNameInput, setNPCNameInput] = useState("");
  const [NPCSrcInput, setNPCSrcInput] = useState("");

  const handleOnLoadNPC = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const newSprite: Spriteinfo = {
      name: `${NPCNameInput}`,
      posX: 0,
      posY: 0,
      height: 0,
      width: 0,
      imgSrc: `${NPCSrcInput}`,
      controller: "dm",
    };

    // Make sure name is unique
    if (sprites.some((sprite) => sprite.name === NPCNameInput)) {
      alert("Name already exists.");
      return;
    }

    if (NPCNameInput === "" || NPCSrcInput === "") {
      alert("invalid entry");
      return;
    }

    setSprites((prev) => [...prev, newSprite]);
    setNPCNameInput("");
    setNPCSrcInput("");
  };

  // has error might not work
  const hasError = useTryLoadImg(NPCSrcInput);

  const handleOnChangeNPCSrc = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNPCSrcInput(e.target.value);
  };

  const handleOnChangeNPCName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNPCNameInput(e.target.value);
  };

  return (
    <>
      <Head>
        <title>DND map</title>
        <meta name="description" content="ew" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-600">
        <h1>NPC planner</h1>
        <div className="flex">
          <div>
            <CharacterBar
              sprites={sprites}
              setMap={setMap}
              map={map}
              mapRect={mapRect}
            />
          </div>
          <div>
            <div>
              <DungeonMap
                key={JSON.stringify(mapRect)}
                sprites={sprites}
                setSprites={setSprites}
                mapRef={mapRef}
                mapRect={mapRect}
                map={map}
                setMap={setMap}
              />
            </div>
            <div className="mt-6">
              <form>
                <input
                  onChange={handleOnChangeNPCName}
                  value={NPCNameInput}
                  placeholder="NPC name"
                />
                <input
                  onChange={handleOnChangeNPCSrc}
                  value={NPCSrcInput}
                  placeholder="img url"
                />
                <button onClick={handleOnLoadNPC}>Load NPC</button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default PlaceNpc;
