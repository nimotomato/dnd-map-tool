import Link from "next/link";
import Head from "next/head";
import React, {
  MouseEvent as ReactMouseEvent,
  useRef,
  useState,
  useEffect,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { v4 as uuidv4 } from "uuid";

import { api } from "~/utils/api";

import DungeonMap from "~/components/DungeonMap";
import CharacterBar from "~/components/CharacterBar";
import useGetMapRect from "../hooks/useGetMapRect";
import useTryLoadImg from "~/hooks/useTryLoadImg";
import useDebounce from "~/hooks/useDebounce";

import { MapProps, Game, Character } from "~/types";

const defaultMap = "/img/dungeonmap.jpg";

const NewGame = () => {
  const session = useSession();
  const currentUser = session.data?.user;
  const router = useRouter();

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
      zoom: 6,
      spriteSize: 10,
    },
    isPaused: true,
    players: [],
    dungeonMaster: "",
    characters: [],
    turnIndex: 0,
  });

  // LOCAL MAP STUFF
  const [map, setMap] = useState<MapProps>({
    posX: 0,
    posY: 0,
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
  const [debouncedPlayerInput, setDebouncedPlayerInput] = useState("");
  const [mapInput, setMapInput] = useState("");
  const [border, setBorder] = useState({
    color: "border-black",
    size: "border",
  });
  const [errorText, setErrorText] = useState("");

  // Magic API
  // Get user specifically asked for in input
  const getUser = api.user.getUser.useQuery({
    userEmail: debouncedPlayerInput,
  });

  // Debounced input
  const debouncedSetInput = useDebounce(setDebouncedPlayerInput, 300);

  // Update the debounced input from player input
  useEffect(() => {
    debouncedSetInput(playerInput);
  }, [playerInput]);

  // Adds current user to players
  useEffect(() => {
    if (!currentUser?.id || gameState.dungeonMaster !== "") return;

    setGameState((prev) => ({
      ...prev,
      dungeonMaster: currentUser.id,
      players: [{ id: currentUser.id, name: currentUser.name ?? "anon" }],
    }));
  }, [currentUser]);

  const handleOnAddPlayer = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!getUser.data) {
      setBorder({ color: "border-rose-500", size: "border-2" });
      setErrorText("User email not found, try again.");

      return;
    }

    const playerIds = gameState.players.map((player) => player.id);

    if (
      // Verify username exists in database
      playerIds.includes(getUser.data.id)
    ) {
      setBorder({ color: "border-rose-500", size: "border-2" });
      setErrorText("User already in game, try again.");

      return;
    }

    const userData = getUser.data;

    setGameState((prev) => ({
      ...prev,
      players: [
        ...prev.players,
        { id: userData.id, name: userData.name ?? "anon" },
      ],
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
    name: string
  ) => {
    e.preventDefault();
    const filteredPlayers = gameState.players.filter(
      (player) => player.name !== name
    );

    setGameState((prev) => ({
      ...prev,
      players: [...filteredPlayers],
    }));
  };

  // SPRITE STUFF

  const [NPCNameInput, setNPCNameInput] = useState("");
  const [NPCSrcInput, setNPCSrcInput] = useState("");

  const handleOnLoadNPC = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!currentUser) {
      alert("User not logged in.");
      return;
    }

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

    const newChar: Character = {
      characterId: uuidv4(),
      name: `${NPCNameInput}`,
      imgSrc: `${NPCSrcInput}`,
      positionX: mapRectWidth,
      positionY: mapRectHeight,
      controllerId: currentUser.id,
      initiative: 0,
      isDead: false,
    };

    if (NPCNameInput === "" || NPCSrcInput === "") {
      alert("invalid entry");
      return;
    }

    // Add new character
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
  const createGameMutation = api.game.postNewGame.useMutation();

  // Send data to DB
  // Redo this shit
  const createGame = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.name || currentUser.name === "") return;

    if (gameState.name === "") {
      alert("No game name.");
      return;
    }

    if (gameState.players.length === 0) {
      alert("Not enough players.");
      return;
    }

    if (gameState.players.length > 5) {
      alert("Too many players.");
      return;
    }

    // really make sure ids are unique
    const playerIds = Array.from(
      new Set(gameState.players.map((player) => player.id))
    );

    const characterData = gameState.characters.map((character) => {
      return {
        characterId: character.characterId,
        name: character.name,
        imgSrc: character.imgSrc,
        controllerId: character.controllerId,
      };
    });

    const charInGameData = gameState.characters.map((character) => {
      return {
        characterId: character.characterId,
        gameId: gameState.id,
        initiative: character.initiative,
        positionX: character.positionX,
        positionY: character.positionY,
        isDead: character.isDead,
      };
    });

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
        turnIndex: gameState.turnIndex,
      },
      characterData: characterData,
      userIds: playerIds,
      charInGameData: charInGameData,
    }),
      {
        onSuccess: (response: Response) => {
          void router.push("/"); // if successful return to home page
        },
      },
      {
        onError: (error: Error) => {
          alert("Error creating game");
          console.error("An error occurred:", error);
        },
      };
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
                  isDm={true}
                  createMode={true}
                />
              </div>
              <br></br>
              <label>Invite players</label>
              <div>
                {gameState.players.length > 0 &&
                  gameState.players.map((player) => {
                    return (
                      <div key={gameState.players.indexOf(player)}>
                        {gameState.players.indexOf(player) === 0 ? (
                          <p>{`Dungeon Master: ${player.name}`} </p>
                        ) : (
                          <>
                            <p>
                              {`Player ${gameState.players.indexOf(player)}: `}
                              {player.name}
                            </p>
                            <button
                              onClick={(e) => handleOnRemove(e, player.name)}
                            >
                              Remove player
                            </button>
                          </>
                        )}
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
                  gameState={gameState}
                  setMap={setMap}
                  map={map}
                  mapRect={mapRect}
                  setGameState={setGameState}
                  createMode={true}
                />
              </div>
              <div>
                <div>
                  <DungeonMap
                    key={JSON.stringify(mapRect)}
                    sprites={gameState.characters}
                    mapRef={mapRef}
                    mapRect={mapRect}
                    map={map}
                    setMap={setMap}
                    gameState={gameState}
                    setGameState={setGameState}
                    isDm={true}
                    createMode={true}
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
