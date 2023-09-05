import Link from "next/link";
import Head from "next/head";
import React, {
  MouseEvent as ReactMouseEvent,
  useRef,
  useState,
  useEffect,
} from "react";
import { useSession } from "next-auth/react";
import { v4 as uuidv4 } from "uuid";

import { api } from "~/utils/api";

import DungeonMap from "~/components/DungeonMap";
import CharacterBar from "~/components/CharacterBar";
import useGetMapRect from "../hooks/useGetMapRect";
import useTryLoadImg from "~/hooks/useTryLoadImg";

import { MapProps, Spriteinfo, Game, Character } from "~/types";

const defaultMap = "/img/dungeonmap.jpg";

const NewGame = () => {
  const session = useSession();
  const user = session.data?.user;

  const [step, setStep] = useState(0);
  const nextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (gameState.name === "") {
      alert("Must enter game name");
      return;
    }

    setStep(1);
  };

  const prevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep(0);
  };

  // GAME DATA
  const gameID = useRef(uuidv4());
  const [gameState, setGameState] = useState<Game>({
    id: gameID.current,
    name: "",
    map: {
      imgSrc: defaultMap,
      posX: 0,
      posY: 0,
      height: 25,
      width: 25,
      zoom: 6,
      spriteSize: 10,
    },
    isPaused: true,
    players: [],
    dungeonMaster: "",
    characters: [],
  });

  // LOCAL MAP STUFF
  const [map, setMap] = useState<MapProps>({
    posX: 0,
    posY: 0,
    height: 25,
    width: 25,
    zoom: 6,
    hasLoaded: false,
  });

  // Game name
  const handleGameName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameState((prev) => ({
      ...prev,
      name: e.target.value,
    }));
  };

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapRect = useGetMapRect(gameState.map.imgSrc, mapRef);

  const handleOnLockCoordinates = (e: React.MouseEvent) => {
    // Loads local state to game state to "save"
    setGameState((prev) => ({
      ...prev,
      map: { ...prev.map, posX: map.posX, posY: map.posY },
    }));
  };

  const handleOnAddMap = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setMapInput("");
    setGameState((prev) => ({
      ...prev,
      map: { ...prev.map, imgSrc: mapInput },
    }));
  };

  const handleOnMapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMapInput(e.target.value);
  };

  // PLAYER STUFF
  const [playerInput, setPlayerInput] = useState("");
  const [mapInput, setMapInput] = useState("");
  const [border, setBorder] = useState({
    color: "border-black",
    size: "border",
  });
  const [errorText, setErrorText] = useState("");

  // Magic API
  // Get user specifically asked for in input
  const getUser = api.user.getUser.useQuery({ userEmail: playerInput });

  useEffect(() => {
    const userId = getUser?.data?.id;

    if (!userId) return;

    setGameState((prev) => ({ ...prev, dungeonMaster: userId }));
  }, [getUser]);

  const handleOnAddPlayer = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (
      !getUser.data ||
      // Verify username exists in database
      // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
      gameState.players.includes(getUser.data.email as string)
    ) {
      setBorder({ color: "border-rose-500", size: "border-2" });
      setErrorText("User email not found, try again.");

      return;
    }

    setGameState((prev) => ({
      ...prev,
      players: [...prev.players, playerInput],
    }));
    setBorder({ color: "border-black", size: "border-2" });
    setErrorText("");
    setPlayerInput("");
  };

  const handleOnPlayerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerInput(e.target.value);
  };

  const handleOnRemove = (
    e: ReactMouseEvent<HTMLButtonElement>,
    player: string
  ) => {
    e.preventDefault();
    const filteredPlaters = gameState.players.filter((name) => name !== player);

    setGameState((prev) => ({
      ...prev,
      players: [...filteredPlaters],
    }));
  };

  // SPRITE STUFF
  const [sprites, setSprites] = useState<Array<Spriteinfo>>([]);

  const [NPCNameInput, setNPCNameInput] = useState("");
  const [NPCSrcInput, setNPCSrcInput] = useState("");

  const handleOnLoadNPC = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    let mapRectWidth = mapRect?.width;
    let mapRectHeight = mapRect?.height;

    if (!mapRectWidth) {
      mapRectWidth = 0;
    } else {
      mapRectWidth = mapRectWidth / 2;
    }

    if (!mapRectHeight) {
      mapRectHeight = 0;
    } else {
      mapRectHeight = mapRectHeight / 2;
    }

    const newSprite: Spriteinfo = {
      name: `${NPCNameInput}`,
      posX: mapRectWidth,
      posY: mapRectHeight,
      height: 0,
      width: 0,
      imgSrc: `${NPCSrcInput}`,
      controller: "dm",
    };

    const newChar: Character = {
      ...newSprite,
      gameId: gameState.id,
      positionX: newSprite.posX,
      positionY: newSprite.posY,
      controllerId: newSprite.controller,
      initiative: 0,
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

    // Add sprite to local sprites
    setSprites((prev) => [...prev, newSprite]);

    // Add sprite to chracter
    setGameState((prev) => ({
      ...prev,
      characters: [...prev.characters, newChar],
    }));

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

  // DB queries to create a new gaMe
  const createGameMutation = api.game.createNewGame.useMutation();

  // Send data to DB
  // Redo this shit
  const createGame = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user || !user.name || user.name === "") return;

    if (gameState.name === "") {
      alert("No game name.");
      return;
    }

    if (gameState.players.length === 0 || gameState.players.length > 4) {
      alert("Not enough players.");
      return;
    }

    createGameMutation.mutate({
      gameData: {
        gameId: gameState.id,
        name: gameState.name,
        mapSrc: gameState.map.imgSrc,
        mapPosX: gameState.map.posX,
        mapPosY: gameState.map.posY,
        mapZoom: gameState.map.zoom,
        spriteSize: gameState.map.spriteSize,
        isPaused: gameState.isPaused,
        dungeonMasterId: gameState.dungeonMaster,
      },
      characterData: gameState.characters,
      userIds: gameState.players,
    });
  };

  return (
    <>
      <Head>
        <title>DND map</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-600">
        {step === 0 && (
          <>
            <h1>Create new game!</h1>
            <form>
              <label>Game Name: </label>
              <input
                placeholder="game name here"
                onChange={handleGameName}
                value={gameState.name}
              ></input>
              <label>Select map</label>
              <input
                placeholder="img url here"
                onChange={handleOnMapChange}
                value={mapInput}
              ></input>
              <button onClick={handleOnAddMap}>Fetch</button>
              <div className="m-6">
                <DungeonMap
                  key={JSON.stringify(mapRect)}
                  mapRef={mapRef}
                  mapRect={mapRect}
                  map={map}
                  setMap={setMap}
                  gameState={gameState}
                  setGameState={setGameState}
                />
              </div>
              <br></br>
              <label>Invite players</label>
              <div>
                {gameState.players.length > 0 &&
                  gameState.players.map((player) => {
                    return (
                      <div key={gameState.players.indexOf(player)}>
                        <p>
                          Player {`${gameState.players.indexOf(player) + 1}`}{" "}
                          {player}
                        </p>
                        <button onClick={(e) => handleOnRemove(e, player)}>
                          Remove player
                        </button>
                      </div>
                    );
                  })}
                <input
                  type="text"
                  placeholder="discord email here"
                  className={`${border.size} ${border.color}`}
                  value={playerInput}
                  onChange={handleOnPlayerChange}
                ></input>
                {errorText && <p>{errorText}</p>}
                <button onClick={handleOnAddPlayer}>Add player</button>
              </div>
            </form>
            <div className="flex space-x-1">
              <Link href="/">Go back</Link>
              <button onClick={nextStep}>Next step</button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
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
                    gameState={gameState}
                    setGameState={setGameState}
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
                  <input
                    value={`X: ${Math.abs(gameState.map.posX)}, Y: ${Math.abs(
                      gameState.map.posY
                    )}`}
                    readOnly
                  ></input>
                  <button onClick={handleOnLockCoordinates}>
                    Lock starting coordinates.
                  </button>
                </div>
                <button onClick={prevStep}>Go back</button>
              </div>
            </div>
            <div>
              <button onClick={createGame}>Create game</button>
            </div>
          </>
        )}
      </main>
    </>
  );
};

export default NewGame;
