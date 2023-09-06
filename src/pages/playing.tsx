import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";

import { api } from "~/utils/api";

import DungeonMap from "~/components/DungeonMap";
import useGetMapRect from "../hooks/useGetMapRect";
import { MapProps, Game } from "~/types";

const GameBoard = () => {
  const session = useSession();
  const currentUser = session.data?.user;

  // get gameId through search params
  const gameIdParam = useSearchParams().get("data")?.replace(/"/g, "");

  // Get game details (gamedata, characters and users) through query params
  const gameData = api.game.getGame.useQuery({ gameId: gameIdParam ?? "" });

  // Validate user is in the game
  // Get all users in game
  const users = api.user.getUsersInGame.useQuery({ gameId: gameIdParam ?? "" });

  // Filter out the userIds
  const userIds = users.data?.map((user) => user.user.id) ?? [];

  // Error and return to index if userId is not in the game
  if (
    userIds.length > 0 &&
    currentUser?.id &&
    !userIds?.includes(currentUser.id)
  ) {
    alert("User not invited!");
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
  const updateInitiative = api.character.updateInitiative.useMutation();

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

    // Set up an array of character IDs and initiative rolls.
    const initiativeRolls = charactersInGame.data.map((character) => {
      const initiativeRoll = Math.floor(
        Math.random() * (maxRoll - minRoll + 1) + minRoll
      );

      return { characterId: character.characterId, initiative: initiativeRoll };
    });

    // Update inititative on DB
    updateInitiative.mutate(initiativeRolls);
  };

  // Allow DM to pause and unpause the game
  // Prepare API call
  const pauseGame = api.game.pauseGame.useMutation();
  const unPauseGame = api.game.unPauseGame.useMutation();

  // Local pause state for snappier pause feel for the DM
  const [isLocalPaused, setIsLocalPaused] = useState(
    gameData.data?.isPaused ?? true
  );

  // Make sure local state reflects DB
  useEffect(() => {
    if (!gameData.data) return;

    setIsLocalPaused(gameData.data.isPaused);
  }, [gameData.data]);

  const handleOnPauseToggle = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!gameIdParam) return;

    if (isLocalPaused) {
      unPauseGame.mutate({ gameId: gameIdParam });
      setIsLocalPaused(false);
    } else {
      pauseGame.mutate({ gameId: gameIdParam });
      setIsLocalPaused(true);
    }
  };

  const renderPause = () => {
    if (isLocalPaused) {
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
  });

  useEffect(() => {
    if (!gameData.data || !users.data || !charactersInGame.data) return;

    const data = gameData.data;

    const currentUsers = users.data.map((user) => ({
      id: user.user.id,
      name: user.user.name ?? "anon",
    }));

    const characterData = charactersInGame.data.map((character) => ({
      ...character,
      positionX: character.positionX.toNumber(),
      positionY: character.positionY.toNumber(),
    }));

    setMap({
      posX: data.mapPosX.toNumber(),
      posY: data.mapPosY.toNumber(),
      zoom: data.mapZoom,
      hasLoaded: false,
    });

    setLocalGameState((prev) => ({
      ...prev,
      name: data.name,
      map: {
        ...prev.map,
        imgSrc: data.mapSrc,
        posX: data.mapPosX.toNumber(),
        posY: data.mapPosY.toNumber(),
        zoom: data.mapZoom,
      },
      isPaused: data.isPaused,
      players: currentUsers,
      dungeonMaster: data.dungeonMasterId,
      characters: characterData,
    }));
  }, [gameData.data]);

  // Keep track of whos turn it is with [{playerId: string, initiative: number}]
  // Allow one player to move and end their turn on a button click.
  // Update character position

  return (
    <>
      <Head>
        <title>DND map</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-600">
        <div>
          {renderPause()}

          <DungeonMap
            key={JSON.stringify(mapRect)}
            mapRef={mapRef}
            mapRect={mapRect}
            map={map}
            setMap={setMap}
            gameState={localGameState}
            setGameState={setLocalGameState}
            isDm={true}
            sprites={sprites}
            setSprites={setSprites}
          />
        </div>
        <Link href="/">Main menu</Link>
      </main>
    </>
  );
};

export default GameBoard;
