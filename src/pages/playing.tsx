import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";

import { api } from "~/utils/api";

import DungeonMap from "~/components/DungeonMap";
import useGetMapRect from "../hooks/useGetMapRect";
import { MapProps, Game, Character } from "~/types";
import CharacterBar from "~/components/CharacterBar";
import { useRouter } from "next/router";

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

      return {
        characterId: character.characterId,
        initiative: initiativeRoll,
        gameId: gameIdParam ?? "",
      };
    });

    // Update inititative on DB
    updateInitiative.mutate(initiativeRolls);
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

    if (!gameIdParam) return;

    if (localGameState.isPaused) {
      unPauseGame.mutate({ gameId: gameIdParam });
      setLocalGameState((prev) => ({
        ...prev,
        isPaused: false,
      }));
    } else {
      pauseGame.mutate({ gameId: gameIdParam });
      setLocalGameState((prev) => ({
        ...prev,
        isPaused: true,
      }));
    }
  };

  const renderPause = () => {
    if (localGameState.isPaused) {
      return (
        <>
          {isDMRef.current ? (
            <>
              <h1>Game is paused.</h1>
              <button onClick={handleOnPauseToggle}>Unpause game.</button>
            </>
          ) : (
            <>
              <h1>Game is paused.</h1>
              <h2>Wait for DM to unpause.</h2>
            </>
          )}
        </>
      );
    } else {
      return (
        <>
          {isDMRef.current ? (
            <>
              <button onClick={handleOnPauseToggle}>Pause game.</button>
            </>
          ) : (
            <></>
          )}
        </>
      );
    }
  };

  // Map stuff
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapRect = useGetMapRect(gameData.data?.mapSrc ?? "", mapRef);
  const [map, setMap] = useState<MapProps>({
    posX: 0,
    posY: 0,
    zoom: 6,
    hasLoaded: false,
  });

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
  });

  useEffect(() => {
    if (!gameData.data || !users.data || !charactersInGame.data) return;

    const data = gameData.data;
    const characterData = charactersInGame.data.map((character) => ({
      ...character.Character,
      positionX: Number(character.positionX),
      positionY: Number(character.positionY),
      characterId: character.characterId,
      initiative: character.initiative,
      isDead: character.isDead,
    }));

    const currentUsers = users.data.map((user) => ({
      id: user.User.id,
      name: user.User.name ?? "anon",
    }));

    setMap({
      posX: Number(data.mapPosX),
      posY: Number(data.mapPosY),
      zoom: data.mapZoom,
      hasLoaded: true,
    });

    setLocalGameState((prev) => ({
      ...prev,
      name: data.name,
      map: {
        ...prev.map,
        imgSrc: data.mapSrc,
        posX: Number(data.mapPosX),
        posY: Number(data.mapPosY),
        zoom: data.mapZoom,
        spriteSize: data.spriteSize,
      },
      isPaused: data.isPaused,
      players: currentUsers,
      dungeonMaster: data.dungeonMasterId,
      turnIndex: data.turnIndex,
      characters: characterData,
    }));
  }, [gameData.data]);

  useEffect(() => {
    if (!charactersInGame.data) return;

    const characterData = charactersInGame.data.map((character) => ({
      ...character.Character,
      positionX: Number(character.positionX),
      positionY: Number(character.positionY),
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
  const [userTurnIndex, setUserTurnIndex] = useState(0);

  // Allow user to end their turn.
  const endTurn = (e: React.MouseEvent) => {
    if (!localGameState || localGameState.isPaused) return;

    if (!charactersInGame || !charactersInGame.data) return;

    setUserTurnIndex((prev) => {
      if (prev >= charactersInGame.data.length - 1) {
        return 0;
      }

      return prev + 1;
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

  //Refreshes game and character data
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     void gameData.refetch();
  //     void charactersInGame.refetch();
  //   }, 500);

  //   return () => {
  //     clearInterval(timer);
  //   };
  // }, []);

  if (!gameData.data) {
    return (
      <>
        <Head>
          <title>DND map</title>
          <meta name="description" content="Generated by create-t3-app" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className="flex min-h-screen flex-col items-center justify-center bg-slate-600">
          <h1>Game ID does not exists</h1>
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
        <title>DND map</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-600">
        {renderPause()}
        {currentUser?.id === localGameState.dungeonMaster && (
          <div>
            <button onClick={handleOnRollInitiative}>Roll initiative!</button>
          </div>
        )}
        <div className="flex">
          <div>
            <CharacterBar
              sprites={localGameState.characters}
              setMap={setMap}
              map={map}
              mapRect={mapRect}
            />
          </div>
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
            userTurnIndex={userTurnIndex}
            setUserTurnIndex={setUserTurnIndex}
            userQueue={userQueue}
          />
          <div>
            <p>{`Current turn: ${userQueue[userTurnIndex]?.name}`} </p>
            {userQueue[userTurnIndex]?.controllerId === currentUser?.id && (
              <button onClick={endTurn}>End turn</button>
            )}
          </div>
        </div>
        <div className="m-12">
          <Link href="/">Main menu</Link>
        </div>
      </main>
    </>
  );
};

export default GameBoard;
