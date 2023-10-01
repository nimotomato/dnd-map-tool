import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import { api } from "~/utils/api";
import DungeonMap from "~/components/DungeonMap";
import Modal from "~/components/Modal";
import useGetMapRect from "../hooks/useGetMapRect";
import CharacterBar from "~/components/CharacterBar";
import { useRouter } from "next/router";
import { MapProps, Game } from "~/types";
const bg = "/img/bg2.png";
const torch = "/img/torch.gif";

const GameBoard = () => {
  const session = useSession();
  const currentUser = session.data?.user;
  const router = useRouter();

  // get gameId through search params
  const gameIdParam = useSearchParams().get("data")?.replace(/"/g, "");

  // Get game details (gamedata, characters and users) through query params
  const gameData = api.game.getGame.useQuery({ gameId: gameIdParam ?? "" });

  // Validate user is in the game
  // Get all users in game
  const users = api.user.getUsersInGame.useQuery({ gameId: gameIdParam ?? "" });

  // Filter out the userIds
  const userIds = users.data?.map((user) => user.User.id) ?? [];

  // Error and return to index if userId is not in the game
  if (
    userIds.length > 0 &&
    currentUser?.id &&
    !userIds?.includes(currentUser.id)
  ) {
    alert("User not invited!");
    void router.push("/");
  }

  // Keep track of DM privileges
  const isDMRef = useRef(false);
  // Check if current user is DM
  if (gameData.data?.dungeonMasterId === currentUser?.id) {
    // If so, set true
    isDMRef.current = true;
  }

  // Get all characters in game
  const charactersInGame = api.character.getCharactersInGame.useQuery({
    gameId: gameIdParam ?? "",
  });

  // Allow DM to roll initiative for all characters
  // Prepare API call
  const updateInitiative = api.character.patchInitiative.useMutation();

  // Rolls initiative and updates to database
  const handleOnRollInitiative = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!gameIdParam || !currentUser) return;

    if (
      !charactersInGame ||
      !charactersInGame.data ||
      charactersInGame.data.length < 1
    ) {
      console.log("Error fetching characters: ", charactersInGame);
      return;
    }
    const maxRoll = 20;
    const minRoll = 1;

    const characters = charactersInGame.data.map(
      (character) => character.Character
    );

    // Set up an array of character IDs and initiative rolls.
    const initiativeRolls = characters.map((character) => {
      const initiativeRoll = Math.floor(
        Math.random() * (maxRoll - minRoll + 1) + minRoll
      );
      console.log(initiativeRoll);

      return {
        characterId: character.characterId,
        initiative: initiativeRoll + character.dexModifier,
        gameId: gameIdParam ?? "",
      };
    });

    // Update inititative on DB
    updateInitiative.mutate(initiativeRolls);
    unPauseGame.mutate({ gameId: gameIdParam });
    setLocalGameState((prev) => ({
      ...prev,
      isPaused: false,
    }));
    setModalIsOpen(false);
  };

  // Allow DM to pause and unpause the game
  // Prepare API call
  const pauseGame = api.game.patchGamePause.useMutation();
  const unPauseGame = api.game.patchGameUnpause.useMutation();

  // Make sure local state reflects DB
  useEffect(() => {
    if (!gameData.data) return;

    setLocalGameState((prev) => ({
      ...prev,
      isPaused: gameData?.data?.isPaused ?? true,
    }));
  }, [gameData.data?.isPaused]);

  const handleOnPauseToggle = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!gameIdParam || !currentUser) return;

    if (currentUser.id !== gameData.data?.dungeonMasterId) return;

    if (localGameState.isPaused) {
      unPauseGame.mutate({ gameId: gameIdParam });
      setLocalGameState((prev) => ({
        ...prev,
        isPaused: false,
      }));
      setModalIsOpen(false);
    } else {
      pauseGame.mutate({ gameId: gameIdParam });
      setLocalGameState((prev) => ({
        ...prev,
        isPaused: true,
      }));
      setModalIsOpen(true);
    }
  };

  const [modalIsOpen, setModalIsOpen] = useState(false);

  // Map stuff
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapRect = useGetMapRect(gameData.data?.mapSrc ?? "", mapRef);
  const [map, setMap] = useState<MapProps>({
    positionX: 0,
    positionY: 0,
    hasLoaded: false,
  });
  const [initialStateCameraPosIsSet, setInitialStateCameraPosIsSet] =
    useState(false);

  // Local game state
  const [localGameState, setLocalGameState] = useState<Game>({
    id: gameIdParam ?? "",
    name: "",
    map: {
      imgSrc: "",
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

  const startingMapPosition = api.game.getStartingMapPosition.useQuery({
    gameId: gameIdParam ?? "",
  }).data;

  useEffect(() => {
    if (!startingMapPosition) return;

    const startingPos = startingMapPosition[0];

    if (!startingPos) return;

    setMap((prev) => {
      return {
        ...prev,
        positionX: Number(startingPos.mapPosX),
        positionY: Number(startingPos.mapPosY),
      };
    });
  }, [startingMapPosition]);

  useEffect(() => {
    if (!gameData.data || !users.data || !charactersInGame.data) return;

    const data = gameData.data;
    const characterData = charactersInGame.data.map((character) => ({
      ...character.Character,
      positionX: Number(character.positionX),
      positionY: Number(character.positionY),
      prevPositionX: Number(character.positionX),
      prevPositionY: Number(character.positionY),
      characterId: character.characterId,
      initiative: character.initiative,
      isDead: character.isDead,
    }));

    const currentUsers = users.data.map((user) => ({
      id: user.User.id,
      name: user.User.name ?? "anon",
    }));

    setLocalGameState((prev) => ({
      ...prev,
      name: data.name,
      map: {
        ...prev.map,
        imgSrc: data.mapSrc,
        zoom: data.mapZoom,
        spriteSize: data.spriteSize,
      },
      isPaused: data.isPaused,
      players: currentUsers,
      dungeonMaster: data.dungeonMasterId,
      turnIndex: data.turnIndex,
      characters: characterData,
    }));

    // Set initial camera position
    localGameState.characters.map((sprite) => {
      if (currentUser?.id !== sprite.controllerId) return;
      if (!mapRect) return;
      if (initialStateCameraPosIsSet) return;
      // || !isDMRef.current

      // Calculate relative positioning of map
      let newX = -sprite.positionX + mapRect.width / 2;
      let newY = -sprite.positionY + mapRect.height / 2;

      // Contain bounds of map
      if (newX > 0) newX = 0;
      if (newY > 0) newY = 0;

      // Lazy divider
      const lazyConstantX = 1.3;
      const lazyConstantY = 1.2;
      if (newX < -mapRect.fullWidth)
        newX = -sprite.positionX + mapRect.width / lazyConstantX;

      if (newY < -mapRect.fullWidth)
        newY = -sprite.positionY + mapRect.height / lazyConstantY;

      setMap((prevMap) => ({ ...prevMap, positionX: newX, positionY: newY }));
      setInitialStateCameraPosIsSet(true);
    });

    setModalIsOpen(data.isPaused);
  }, [gameData.data]);

  useEffect(() => {
    if (!charactersInGame.data) return;

    const characterData = charactersInGame.data.map((character) => ({
      ...character.Character,
      positionX: Number(character.positionX),
      positionY: Number(character.positionY),
      prevPositionX: Number(character.positionX),
      prevPositionY: Number(character.positionY),
      characterId: character.characterId,
      initiative: character.initiative,
      isDead: character.isDead,
    }));

    setLocalGameState((prev) => ({ ...prev, characters: characterData }));
  }, [charactersInGame.data]);

  // Allow one player to move and end their turn on a button click.
  const [userQueue, setUserQueue] = useState(
    localGameState.characters.sort((a, b) => {
      return b.initiative - a.initiative;
    })
  );

  // Keep track of whose turn it is.
  const patchTurnIndex = api.game.patchTurnIndex.useMutation();
  const patchPrevPosition = api.character.patchPrevPosition.useMutation();

  // Allow user to end their turn.
  const endTurn = (e: React.MouseEvent) => {
    if (!localGameState || localGameState.isPaused) return;

    if (!charactersInGame || !charactersInGame.data) return;

    const char = userQueue[localGameState.turnIndex];

    if (!char) {
      alert("Error with char in user queue");
      return;
    }

    setLocalGameState((prevState) => {
      let nextIndex: number;

      if (prevState.turnIndex >= charactersInGame.data.length - 1) {
        nextIndex = 0;
      } else {
        nextIndex = prevState.turnIndex + 1;
      }

      patchTurnIndex.mutate({
        turnIndex: nextIndex,
        gameId: localGameState.id,
      });

      return { ...prevState, turnIndex: nextIndex };
    });

    patchPrevPosition.mutate({
      characterId: char.characterId,
      gameId: localGameState.id,
      prevPositionX: char.positionX,
      prevPositionY: char.positionY,
    });
  };

  // Sort the queue
  useEffect(() => {
    setUserQueue(
      localGameState.characters.sort((a, b) => {
        return b.initiative - a.initiative;
      })
    );
  }, [localGameState.characters]);

  const [isMoving, setIsMoving] = useState(false);

  //  Refreshes game and character data
  useEffect(() => {
    if (isMoving) return;
    const timer = setInterval(() => {
      void gameData.refetch();
      void charactersInGame.refetch();
    }, 2000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (!gameData.data) {
    return (
      <>
        <Head>
          <title>DND map</title>
          <meta name="description" content="Generated by create-t3-app" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <main
          style={{
            backgroundImage: `url(${bg})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
          className="justify-top flex min-h-screen flex-col items-center bg-stone-950 text-slate-200"
        >
          <h1 className="mb-12 mt-28 select-none font-quentincaps text-6xl text-red-700 drop-shadow-xl ">
            Game ID does not exists
          </h1>
          <div className="m-12">
            <Link href="/">Main menu</Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{gameData.data.name}</title>
      </Head>
      <main
        style={{
          backgroundImage: `url(${bg})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
        className="justify-top flex min-h-screen flex-col items-center bg-stone-950 text-slate-200"
      >
        <h1 className="mb-12 mt-28 select-none font-quentincaps text-6xl text-red-700 drop-shadow-xl ">
          {gameData.data.name}
        </h1>
        <div className="flex">
          <div className="flex -translate-x-20 items-center">
            <img src={torch} style={{ height: 120 }} />
            <div
              className="absolute h-20 w-12 translate-y-28 select-none bg-transparent"
              style={{
                boxShadow: "10px -190px 100px #fde047",
                color: "rgba(0, 0, 0, 0)",
              }}
            />
          </div>
          <Modal open={modalIsOpen} setClose={() => setModalIsOpen(false)}>
            <div className="h-auto w-56 items-center text-center ">
              {localGameState.isPaused && (
                <>
                  {isDMRef.current ? (
                    <>
                      {localGameState.characters.every(
                        (character) => character.initiative === 0
                      ) ? (
                        <>
                          <h1 className="text-stone-700">
                            No initiative! Roll initiative to start the game.{" "}
                          </h1>
                          <button
                            className="z-50 mt-1 rounded border-2 border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 text-sm hover:bg-stone-700"
                            onClick={handleOnRollInitiative}
                          >
                            Roll
                          </button>
                        </>
                      ) : (
                        <>
                          <h1 className="text-stone-700">Game is paused.</h1>
                          <button
                            className="z-50 mt-1 rounded border-2 border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 text-sm hover:bg-stone-700"
                            onClick={handleOnPauseToggle}
                          >
                            Unpause game.
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="h-auto w-56 items-center text-center text-stone-700">
                        <h1>Game is paused.</h1>
                        <h2>Wait for DM to unpause.</h2>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </Modal>
          <div className="flex rounded border-8 border-double border-emerald-900 bg-stone-900 px-5 pb-9 pt-2">
            <div>
              <CharacterBar
                gameState={localGameState}
                setMap={setMap}
                map={map}
                mapRect={mapRect}
                setGameState={setLocalGameState}
                createMode={false}
              />
            </div>
            <div>
              <DungeonMap
                key={JSON.stringify(mapRect)}
                mapRef={mapRef}
                mapRect={mapRect}
                map={map}
                setMap={setMap}
                gameState={localGameState}
                setGameState={setLocalGameState}
                isDm={true}
                sprites={localGameState.characters}
                createMode={false}
                userTurnIndex={localGameState.turnIndex}
                userQueue={userQueue}
              />

              <div className="flex justify-end text-right">
                {isDMRef.current && (
                  <>
                    {!localGameState.isPaused ? (
                      <>
                        <button
                          className="z-50 mr-12 mt-1 rounded border-2 border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 text-sm hover:bg-stone-700"
                          onClick={handleOnPauseToggle}
                        >
                          Pause game.
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="z-50 mr-12 mt-1 rounded border-2 border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 text-sm hover:bg-stone-700"
                          onClick={handleOnPauseToggle}
                        >
                          Unpause game.
                        </button>
                      </>
                    )}
                  </>
                )}
                {isDMRef.current && (
                  <div className="z-20 mr-6">
                    <button
                      className="mt-1 rounded border-2 border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 text-sm hover:bg-stone-700"
                      onClick={handleOnRollInitiative}
                    >
                      Roll initiative!
                    </button>
                  </div>
                )}
                <p className="mr-2 mt-2 text-sm">
                  {`Current turn: ${userQueue[localGameState.turnIndex]?.name}`}{" "}
                </p>
                {userQueue[localGameState.turnIndex]?.controllerId ===
                  currentUser?.id && (
                  <button
                    className="z-10 mt-1 rounded border-2 border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 text-sm hover:bg-stone-700"
                    onClick={endTurn}
                  >
                    End turn
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex translate-x-20 items-center">
            <img src={torch} style={{ height: 120 }} />
            <div
              className="absolute h-20 w-12 translate-y-28 select-none bg-transparent"
              style={{
                boxShadow: "-10px -190px 100px #fde047",
                color: "rgba(0, 0, 0, 0)",
              }}
            />
          </div>
        </div>
        <Link
          className="m-2 mt-12 rounded border-2 border-solid border-slate-400 bg-stone-600 pl-6 pr-6 hover:bg-stone-700"
          href="/"
        >
          Main menu
        </Link>
      </main>
    </>
  );
};

export default GameBoard;
