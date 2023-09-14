import Link from "next/link";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";

import { api } from "~/utils/api";
import React, { useState, useRef, useEffect } from "react";
import Modal from "~/components/Modal";
import { Character } from "~/types";
import { Decimal } from "@prisma/client/runtime/library";
import { ppid } from "process";

const ActiveGames = () => {
  const session = useSession();
  const currentUser = session.data?.user;
  const router = useRouter();

  // Get all games a user is in.
  const games = api.game.getGames.useQuery({ userId: currentUser?.id ?? "" });

  // Reserved names
  const placeHolderNamesRef = useRef(["1", "2", "3", "4", "5"]);

  // Get all characters of a user
  const characters = api.character.getCharactersOfUser.useQuery({
    userId: currentUser?.id ?? "",
  }).data;

  const charactersFull = api.character.getCharactersOfUserFull.useQuery({
    userId: currentUser?.id ?? "",
  }).data;

  // Remove current user
  const removeUser = api.user.deleteUserFromGame.useMutation();

  // Delete the game
  const deleteGame = api.game.deleteGame.useMutation();

  // Get user's characters and games
  const charsWithGameId = api.character.getCharactersOfUserWithGameId.useQuery({
    userId: currentUser?.id ?? "",
  }).data;

  // Delete game
  const handleOnDelete = (e: React.MouseEvent, gameId: string) => {
    deleteGame.mutate({ gameId: gameId });
    void games.refetch();
  };

  // Leave game
  const handleOnLeave = (e: React.MouseEvent, gameId: string) => {
    if (!currentUser?.id) return;

    removeUser.mutate({ gameId: gameId, controllerId: currentUser.id });
    void games.refetch();
  };

  // Add user's character to game
  const deleteOneAddOneToGame =
    api.character.deleteOneAddOneToGame.useMutation();

  // Modal stuff
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [showCreateNewChar, setShowCreateNewChar] = useState(false);
  const [activeGameId, setActiveGameId] = useState("");
  // const activePlaceholderDataRef = useRef<{
  //   characterId: string;
  //   positionX: number;
  //   positionY: number;
  //   prevPositionX: number;
  //   prevPositionY: number;
  // } | null>(null);

  // // Get user's ingame characters
  // const ingameCharacters = api.character.getCharactersOfUsersInGame.useQuery({
  //   userId: currentUser?.id ?? "",
  //   gameId: activeGameId ?? "",
  // }).data;

  // useEffect(() => {
  //   const placeholders =
  //     ingameCharacters?.filter((character) =>
  //       placeHolderNamesRef.current.includes(character.Character.name)
  //     ) ?? [];

  //   if (placeholders.length !== 1) {
  //     console.log("Error with placeholder count");
  //     return;
  //   }

  //   const placeholder = placeholders[0];

  //   activePlaceholderDataRef.current = {
  //     characterId: placeholder?.Character.characterId ?? "",
  //     positionX: Number(placeholder?.positionX) ?? 0,
  //     positionY: Number(placeholder?.positionY) ?? 0,
  //     prevPositionX: Number(placeholder?.prevPositionX) ?? 0,
  //     prevPositionY: Number(placeholder?.prevPositionY) ?? 0,
  //   };
  // }, [activeGameId]);

  const onCreateNewChar = (e: React.MouseEvent) => {
    void router.push("/create-character");
  };

  const selectCharacter = (
    e: React.MouseEvent,
    character: {
      characterId: string;
      name: string;
      imgSrc: string;
      controllerId: string;
    },
    gameId: string
  ) => {
    const placeholders = charactersFull?.filter((char) => {
      return placeHolderNamesRef.current.includes(char.name);
    });

    const placeholderInGame = placeholders
      ?.filter((char) => {
        return char.CharacterInGame.filter((C) => C.gameId === gameId);
      })
      .flatMap((char) => char.CharacterInGame);

    if (placeholderInGame?.length !== 1) {
      console.log("Error with placeholder count");
      return;
    }

    const placeholder = placeholderInGame[0];

    if (!placeholder) {
      console.log("Placeholder undefined at active-games");
      return;
    }

    console.log(placeholder);

    deleteOneAddOneToGame.mutate(
      {
        deleteCharId: placeholder.characterId,
        characterId: character.characterId,
        positionX: Number(placeholder.positionX),
        positionY: Number(placeholder.positionY),
        prevPositionX: Number(placeholder.prevPositionX),
        prevPositionY: Number(placeholder.prevPositionY),
        initiative: 0,
        gameId: gameId,
        isDead: false,
      },
      {
        onSuccess: (data, variables, context) => {
          void router.push({
            pathname: "/playing",
            query: { data: gameId },
          }); // if successful go to game
        },
        onError: (data, variables, context) => {
          console.error("An error occurred:", data);
        },
      }
    );
  };

  // Join game
  const handleOnJoin = (e: React.MouseEvent, gameId: string) => {
    if (!currentUser?.id || !charsWithGameId || !characters) return;

    setActiveGameId(gameId);

    const originalCharacters = characters.filter(
      (character) => !placeHolderNamesRef.current.includes(character.name)
    );

    if (originalCharacters.length < 1) {
      // MODAL POP UP TELLING USER TO CREATE A CHARACTER BEFORE JOINING
      setShowCreateNewChar(true);
    } else {
      setShowCreateNewChar(false);
    }

    // Check if user has a character there
    const charactersInGame = charsWithGameId.filter(
      (data) =>
        data.gameId === gameId &&
        !placeHolderNamesRef.current.includes(data.Character.name)
    );

    if (charactersInGame.length > 0) {
      void router.push({
        pathname: "/playing",
        query: { data: JSON.stringify(gameId) },
      });
    } else {
      setModalIsOpen(true);
    }
  };

  return (
    <>
      <Head>
        <title>DND map</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-600">
        <h1>Active games</h1>
        <Modal open={modalIsOpen} setClose={() => setModalIsOpen(false)}>
          <div className="h-auto w-56 items-center text-center"></div>
          {showCreateNewChar ? (
            <>
              {
                "You have no characters, please create a new one before joining a game."
              }
              <br />
              <button onClick={onCreateNewChar}> create new character </button>
            </>
          ) : (
            <>
              {"You have no characters in this game."}
              <br />
              {"Choose a character to play with. "}
              {characters
                ?.filter(
                  (character) =>
                    !placeHolderNamesRef.current.includes(character.name)
                )
                .map((character) => {
                  return (
                    <div
                      key={character.characterId}
                      onClick={(e) =>
                        selectCharacter(e, character, activeGameId)
                      }
                      className="h-22 flex w-20 flex-col items-center justify-center rounded-lg p-2 hover:bg-slate-400"
                    >
                      <img
                        src={`${character.imgSrc}`}
                        alt="char image"
                        className="h-14 w-14"
                      ></img>
                      <p>{`${character.name}`}</p>
                    </div>
                  );
                })}
            </>
          )}
        </Modal>
        {games?.data && games.data.length > 0 ? (
          <ul>
            {games.data.map((game) => {
              return (
                <div key={game.Game.gameId}>
                  <li className="mb-3 grid grid-cols-4 gap-4">
                    {game.Game.name}
                    <button onClick={(e) => handleOnJoin(e, game.Game.gameId)}>
                      Join game
                    </button>
                    <button onClick={(e) => handleOnLeave(e, game.Game.gameId)}>
                      Leave game
                    </button>
                    {game.Game.dungeonMasterId === currentUser?.id && (
                      <button
                        onClick={(e) => handleOnDelete(e, game.Game.gameId)}
                      >
                        Delete game
                      </button>
                    )}
                  </li>
                </div>
              );
            })}
          </ul>
        ) : (
          <h2> No active games found. </h2>
        )}

        <Link href="/">Go back</Link>
      </main>
    </>
  );
};

export default ActiveGames;
