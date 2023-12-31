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
import debounce from "lodash/debounce";
import { MapProps, Game, Character } from "~/types";
const defaultMap = "/img/dungeonmap.jpg";
const creategameLogo = "/img/creategame.png";

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

    if (gameState.characters?.length > 0 && step === 0) {
      setGameState((prevState) => {
        const positions = prevState.characters.map((character) => {
          console.log(map.positionX);
          return {
            ...character,
            positionX:
              Math.abs(map.positionX) +
              (gameState.characters.indexOf(character) + 1) * 50,
            positionY:
              Math.abs(map.positionY) +
              (gameState.characters.indexOf(character) + 1) * 20,
            prevPositionX:
              Math.abs(map.positionX) +
              (gameState.characters.indexOf(character) + 1) * 50,
            prevPositionY:
              Math.abs(map.positionY) +
              (gameState.characters.indexOf(character) + 1) * 20,
          };
        });

        return { ...prevState, characters: positions };
      });
    }

    setStep((prev) => prev + 1);
  };

  const prevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep((prev) => prev - 1);
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
    leashDistance: 200,
  });

  // LOCAL MAP STUFF
  const [map, setMap] = useState<MapProps>({
    positionX: 0,
    positionY: 0,
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
  const [coordinatesLocked, setCoordinatesLocked] = useState(false);

  const handleOnLockCoordinates = (e: React.MouseEvent) => {
    // Loads local state to game state to "save"
    setGameState((prev) => ({
      ...prev,
      map: {
        ...prev.map,
        posX: map.positionX,
        posY: map.positionY,
        zoom: gameState.map.zoom,
      },
    }));

    setCoordinatesLocked(true);
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

  // Debounced input stored in ref to ensure stability across lifecycle
  const debouncedSetInputRef = useRef(debounce(setDebouncedPlayerInput, 300));

  // Update the debounced input from player input
  useEffect(() => {
    debouncedSetInputRef.current(playerInput);

    return () => {
      debouncedSetInputRef.current.cancel();
    };
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
    if (!currentUser) {
      alert("No current user");
      return;
    }

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

    const newCharacter = {
      characterId: uuidv4(),
      name: gameState.players.length.toString(),
      positionX: 10 * gameState.players.length * 4,
      positionY: 10,
      prevPositionX: 10 * gameState.players.length * 4,
      prevPositionY: 10,
      imgSrc: `/img/${gameState.players.length}.png`,
      dexModifier: 0,
      isDead: false,
      initiative: 0,
      controllerId: userData.id,
    };

    setGameState((prev) => ({
      ...prev,
      characters: [...prev.characters, newCharacter],
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

    if (NPCNameInput === "" || NPCSrcInput === "" || dexModInput === "") {
      alert("invalid entry");
      return;
    }

    if (NPCNameInput.length < 2) {
      alert("name is too short");
    }

    const newChar: Character = {
      characterId: uuidv4(),
      name: `${NPCNameInput}`,
      imgSrc: `${NPCSrcInput}`,
      positionX: Math.abs(map.positionX) + mapRectHeight,
      positionY: Math.abs(map.positionY) + mapRectWidth,
      prevPositionX: Math.abs(map.positionX) + mapRectHeight,
      prevPositionY: Math.abs(map.positionY) + mapRectWidth,
      controllerId: currentUser.id,
      dexModifier: Number(dexModInput),
      initiative: 0,
      isDead: false,
    };

    // Add new character
    setGameState((prev) => ({
      ...prev,
      characters: [...prev.characters, newChar],
    }));

    setNPCNameInput("");
    setNPCSrcInput("");
    setDexModInput("");
  };

  // has error might not work
  const hasError = useTryLoadImg(NPCSrcInput);

  const handleOnChangeNPCSrc = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNPCSrcInput(e.target.value);
  };

  const handleOnChangeNPCName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNPCNameInput(e.target.value);
  };

  const [dexModInput, setDexModInput] = useState("");

  const handleDexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (/^-?[0-9]*$/.test(e.target.value)) {
      setDexModInput(e.target.value);
    }
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

    if (!coordinatesLocked) {
      alert("Coordinates not locked.");
      return;
    }

    // really make sure ids are unique
    const playerIds = Array.from(
      new Set(gameState.players.map((player) => player.id))
    );

    const characterData = gameState.characters.map((character) => {
      // Filter out all but DM
      return {
        characterId: character.characterId,
        name: character.name,
        imgSrc: character.imgSrc,
        controllerId: character.controllerId,
        dexModifier: character.dexModifier,
      };
    });

    const charInGameData = gameState.characters.map((character) => ({
      gameId: gameState.id,
      characterId: character.characterId,
      initiative: character.initiative,
      positionX: character.positionX,
      positionY: character.positionY,
      prevPositionX: character.prevPositionX,
      prevPositionY: character.prevPositionY,
      isDead: character.isDead,
    }));

    createGameMutation.mutate(
      {
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
          leashDistance: gameState.leashDistance,
        },
        characterData: characterData,
        userIds: playerIds,
        charInGameData: charInGameData,
      },
      {
        onSuccess: (data, variables, context) => {
          void router.push("/"); // if successful return to home page
        },
        onError: (data, variables, context) => {
          alert("Error creating game");
          console.error("An error occurred:", data);
        },
      }
    );
  };

  return (
    <>
      <Head>
        <title>Create New Game</title>
      </Head>
      <main
        className="justify-top flex min-h-screen flex-col items-center bg-stone-950 text-slate-200"
        style={{
          backgroundImage: `url(${
            !useTryLoadImg(gameState.map.imgSrc) && gameState.map.imgSrc
          })`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="mt-8 flex h-52 flex-col items-center justify-center">
          <img src={creategameLogo} width={400} />
        </div>
        {step === 0 && (
          <>
            <h1>Select map, set map zoom and add players.</h1>
            <div className="flex">
              <div className="mr-1 rounded border-8 border-double border-emerald-900 bg-stone-900 px-5 pb-9 pt-2">
                <form className="mb-2 flex  justify-between">
                  <div className="flex-grow">
                    <label>Game Name: </label>
                    <input
                      className={`${border.size} ${border.color} w-48 rounded-sm border-2 border-stone-600 indent-1 text-slate-800`}
                      placeholder="game name"
                      onChange={handleGameName}
                      value={gameState.name}
                    ></input>
                  </div>
                  <div className="">
                    <label>Select map: </label>
                    <input
                      className={`${border.size} ${border.color} w-48 rounded-sm border-2 border-stone-600 indent-1 text-slate-800`}
                      placeholder="img url"
                      onChange={handleOnMapChange}
                      value={mapInput}
                    ></input>
                    <button
                      className="rounded border-2 border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 text-sm hover:bg-stone-700"
                      onClick={handleOnAddMap}
                    >
                      Fetch
                    </button>
                  </div>
                  <br></br>
                </form>
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
                  step={step}
                />
              </div>
              <div className="flex flex-col">
                <h2 className="w-full border-2 border-stone-600 bg-stone-900 text-center text-lg">
                  Invite players
                </h2>
                <div className="flex h-fit flex-col items-center justify-start gap-2 border-2 border-stone-500 bg-stone-800 px-4 py-2  text-center font-light">
                  {gameState.players.length > 0 &&
                    gameState.players.map((player) => {
                      return (
                        <div key={gameState.players.indexOf(player)}>
                          {gameState.players.indexOf(player) === 0 ? (
                            <>
                              <p>Dungeon Master</p>
                              <p>{`${player.name}`} </p>
                            </>
                          ) : (
                            <>
                              <p>
                                {`Player ${gameState.players.indexOf(
                                  player
                                )}: `}
                                {player.name}
                              </p>
                              <button
                                onClick={(e) => handleOnRemove(e, player.name)}
                                className="border-3 rounded border-2 border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 text-sm hover:bg-stone-700"
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
                    placeholder="discord email"
                    className={`${border.size} ${border.color} mt-8 w-48 rounded-sm border-2 border-stone-600 indent-1 text-slate-800`}
                    value={playerInput}
                    onChange={handleOnPlayerChange}
                  ></input>
                  {errorText && <p>{errorText}</p>}
                  <button
                    className="border-3 rounded border-2 border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 text-sm hover:bg-stone-700"
                    onClick={handleOnAddPlayer}
                  >
                    Add player
                  </button>
                </div>
              </div>
            </div>
            <div className="flex space-x-1">
              <Link
                className="border-3 m-2 rounded border-2 border-solid border-slate-400 bg-stone-600 pl-6 pr-6 hover:bg-stone-700"
                href="/"
              >
                Go back
              </Link>
              <button
                className="border-3 m-2 rounded border-2 border-solid border-slate-400 bg-stone-600 pl-6 pr-6 hover:bg-stone-700"
                onClick={nextStep}
              >
                Next step
              </button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h1>Set player starting positions and unit size.</h1>
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
                <div className="mr-1 rounded border-8 border-double border-emerald-900 bg-stone-900 px-5 pb-9 pt-2">
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
                    step={step}
                  />
                </div>
              </div>
            </div>
            <div className="flex">
              <button
                className="border-3 m-2 rounded border-2 border-solid border-slate-400 bg-stone-600 pl-6 pr-6 hover:bg-stone-700"
                onClick={prevStep}
              >
                Go back
              </button>
              <button
                className="border-3 m-2 rounded border-2 border-solid border-slate-400 bg-stone-600 pl-6 pr-6 hover:bg-stone-700"
                onClick={nextStep}
              >
                Next step
              </button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h1>
              Create NPCs, set starting positions and lock starting map
              coordinates.
            </h1>
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
              <div className="mr-1 rounded border-8 border-double border-emerald-900 bg-stone-900 px-5 pb-9 pt-2">
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
                  step={step}
                />
              </div>
              <div className="flex flex-col">
                <h2 className="w-full border-2 border-stone-600 bg-stone-900 text-center text-lg">
                  Create NPCs
                </h2>
                <form className="flex h-fit flex-col items-center justify-start gap-2 border-2 border-stone-500 bg-stone-800 px-4 py-2  text-center font-light">
                  <input
                    onChange={handleOnChangeNPCName}
                    className={` w-48 rounded-sm border-2 border-stone-600 indent-1 text-slate-800`}
                    value={NPCNameInput}
                    placeholder="NPC name"
                  />
                  <input
                    onChange={handleOnChangeNPCSrc}
                    className={`w-48 rounded-sm border-2 border-stone-600 indent-1 text-slate-800`}
                    value={NPCSrcInput}
                    placeholder="img url"
                  />
                  <label>
                    Dexterity modifier <br />
                    <input
                      type="text"
                      className="w-10 rounded-sm border-2 border-stone-600 indent-1 text-slate-800"
                      value={dexModInput}
                      onChange={handleDexInput}
                    />
                  </label>
                  <button
                    className="rounded border-2 border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 text-sm hover:bg-stone-700"
                    onClick={handleOnLoadNPC}
                  >
                    Load NPC
                  </button>
                </form>
                <div className="flex flex-col">
                  <input
                    value={`X: ${Math.abs(gameState.map.posX)}, Y: ${Math.abs(
                      gameState.map.posY
                    )}`}
                    readOnly
                    className={`w-full rounded-sm border-2 border-stone-500 text-center indent-1 text-slate-800`}
                  ></input>
                  <button
                    className="border-3 rounded-sm  border-2 border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 text-sm hover:bg-stone-700"
                    onClick={handleOnLockCoordinates}
                  >
                    Lock starting map coordinates.
                  </button>
                </div>
              </div>
            </div>
            <div>
              <button
                className="border-3 m-2 rounded border-2 border-solid border-slate-400 bg-stone-600 pl-6 pr-6 hover:bg-stone-700"
                onClick={prevStep}
              >
                Go back
              </button>
              <button
                className="border-3 m-2 rounded border-2 border-solid border-slate-400 bg-stone-600 pl-6 pr-6 hover:bg-stone-700"
                onClick={createGame}
              >
                Create game
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
};

export default NewGame;
