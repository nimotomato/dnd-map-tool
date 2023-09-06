import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";

import { api } from "~/utils/api";

import DungeonMap from "~/components/DungeonMap";
import useGetMapRect from "../hooks/useGetMapRect";
import { MapProps, Game, Spriteinfo } from "~/types";
import CharacterBar from "~/components/CharacterBar";

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

  // Keep track of whose turn it is.
  const [userTurnIndex, setUserTurnIndex] = useState(0);

  // If all characters have had their turn, reset the counter.
  useEffect(() => {
    if (!charactersInGame.data) return;

    if (userTurnIndex > charactersInGame.data.length) {
      setUserTurnIndex(0);
    }
  }, [userTurnIndex]);

  // Allow DM to pause and unpause the game
  // Prepare API call
  const pauseGame = api.game.pauseGame.useMutation();
  const unPauseGame = api.game.unPauseGame.useMutation();

  // Make sure local state reflects DB
  useEffect(() => {
    if (!gameData.data) return;

    setLocalGameState((prev) => ({
      ...prev,
      isPaused: gameData?.data?.isPaused ?? true,
    }));
  }, [gameData.data]);

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
  });

  // Local sprites

  useEffect(() => {
    if (!gameData.data || !users.data || !charactersInGame.data) return;

    const data = gameData.data;
    const characters = charactersInGame.data;

    const currentUsers = users.data.map((user) => ({
      id: user.user.id,
      name: user.user.name ?? "anon",
    }));

    const characterData = characters.map((character) => ({
      ...character,
      positionX: Number(character.positionX),
      positionY: Number(character.positionY),
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
      },
      isPaused: data.isPaused,
      players: currentUsers,
      dungeonMaster: data.dungeonMasterId,
      characters: characterData,
    }));
  }, [gameData.data]);

  const [sprites, setSprites] = useState<Spriteinfo[]>([]);

  useEffect(() => {
    if (!charactersInGame.data) return;
    const characterData = charactersInGame.data.map((character) => ({
      ...character,
      positionX: Number(character.positionX),
      positionY: Number(character.positionY),
    }));

    characterData.map((character) => {
      setSprites((prev) => [
        ...prev,
        {
          name: character.name,
          posX: character.positionX,
          posY: character.positionY,
          height: 0,
          width: 0,
          imgSrc: character.imgSrc,
          controller: character.controllerId,
          initiative: character.initiative,
        },
      ]);
    });
  }, [charactersInGame.data]);

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
        {renderPause()}
        {currentUser?.id === localGameState.dungeonMaster && (
          <div>
            <button onClick={handleOnRollInitiative}>Roll initiative!</button>
          </div>
        )}
        <div className="flex">
          <div>
            <CharacterBar
              sprites={sprites}
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
            sprites={sprites}
            setSprites={setSprites}
            createMode={false}
            userTurnIndex={userTurnIndex}
            setUserTurnIndex={setUserTurnIndex}
          />
        </div>
        <div>
          <Link href="/">Main menu</Link>
        </div>
      </main>
    </>
  );
};

export default GameBoard;
