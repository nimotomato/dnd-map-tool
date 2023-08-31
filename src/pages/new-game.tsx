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
    if (gameName === "") {
      alert("Must enter game name");
      return;
    }

    setStep(1);
  };

  const prevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep(0);
  };

  // MAP STUFF
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
  const [lockedCoordinates, setLockedCoordinates] = useState(false);

  const handleOnLockCoordinates = (e: React.MouseEvent) => {
    if (!lockedCoordinates) {
      setGame((prev) => ({ ...prev, mapPosX: map.posX, mapPosY: map.posY }));
    }
    setLockedCoordinates((prev) => !prev);
  };

  const handleOnAddMap = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setMapInput("");
    setMap((prev) => ({ ...prev, imgSrc: mapInput }));
  };

  const handleOnMapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMapInput(e.target.value);
  };

  // PLAYER STUFF
  const [players, setPlayers] = useState<string[]>([]);
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
  // Get all users added to players
  const getManyUsers = api.user.getManyUsers.useQuery(
    players.map((player) => ({
      email: player,
    }))
  );

  const handleOnAddPlayer = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (
      !getUser.data ||
      // Verify username exists in database
      players.includes(getUser.data.email as string)
    ) {
      setBorder({ color: "border-rose-500", size: "border-2" });
      setErrorText("User email not found, try again.");

      return;
    }

    setPlayers((prev) => [...prev, playerInput]);
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
    setPlayers((prev) => {
      return prev.filter((name) => name !== player);
    });
  };

  // Game name
  const [gameName, setGameName] = useState("");
  const handleGameName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameName(e.target.value);
  };

  // SPRITE STUFF
  const [sprites, setSprites] = useState<Array<Spriteinfo>>([]);

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

  // GAME DATA
  const gameID = useRef(uuidv4());
  const [characters, setCharacters] = useState<Character[]>([]);
  const [game, setGame] = useState<Game>({
    id: gameID.current,
    name: "",
    mapSrc: "",
    mapPosX: 0,
    mapPosY: 0,
    isPaused: true,
    players: [],
    dungeonMaster: "",
  });
  const [sendToDb, setSendToDb] = useState(false);

  // DB queries
  const createGameMutation = api.game.createGame.useMutation();
  const createCharactersMutation = api.character.createCharacters.useMutation();
  const connectPlayersMutation = api.game.connectUserToGame.useMutation();

  // Send data to DB
  const createGame = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user || !user.name || user.name === "") return;

    if (gameName === "") {
      alert("No game name.");
      return;
    }

    if (players.length === 0 || players.length > 4) {
      alert("Not enough players.");
      return;
    }

    setGame((prev) => {
      return {
        ...prev,
        players: [...players, user.name!],
        mapSrc: mapInput.trim(),
        name: gameName,
        dungeonMaster: user.name!,
      };
    });

    sprites.map((sprite) => {
      setCharacters((prev) => {
        const nextChar: Character = {
          name: sprite.name,
          positionX: sprite.posX,
          positionY: sprite.posY,
          imgSrc: sprite.imgSrc,
          controller: "dm",
          initiative: 0,
          gameId: gameID.current,
        };
        return [...prev, nextChar];
      });
    });

    setSendToDb(true);
  };

  useEffect(() => {
    if (!sendToDb) return;

    // Upload game to database.
    createGameMutation.mutate(game);

    // Connect players to database.
    //Make sure user data exists
    if (!getManyUsers.data) {
      alert("Error getting user IDs...");
      return;
    }

    // Map with gameID
    const usersInGame = getManyUsers.data.map((user) => ({
      gameId: gameID.current,
      userId: user.id,
    }));

    // Send data to database
    connectPlayersMutation.mutate(usersInGame);

    //Upload characters to database.
    createCharactersMutation.mutate(characters);
  }, [sendToDb]);

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
                value={gameName}
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
                />
              </div>
              <br></br>
              <label>Invite players</label>
              <div>
                {players.length > 0 &&
                  players.map((player) => {
                    return (
                      <div key={players.indexOf(player)}>
                        <p>
                          Player {`${players.indexOf(player) + 1}`} {player}
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
                    value={`X: ${Math.abs(game.mapPosX)}, Y: ${Math.abs(
                      game.mapPosY
                    )}`}
                    readOnly
                  ></input>
                  <button onClick={handleOnLockCoordinates}>
                    {lockedCoordinates
                      ? "Unlock starting coordinates."
                      : "Lock starting coordinates."}
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
