import Link from "next/link";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";

import { api } from "~/utils/api";
import React, { useState } from "react";
import Modal from "~/components/Modal";
import { Character } from "~/types";

const ActiveGames = () => {
  const session = useSession();
  const currentUser = session.data?.user;
  const router = useRouter();

  // Get all games a user is in.
  const games = api.game.getGames.useQuery({ userId: currentUser?.id ?? "" });

  // Get all characters of a user
  const characters = api.character.getCharactersOfUser.useQuery({
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
  const addCharacterToGame = api.character.postCharacterInGame.useMutation();

  // Modal stuff
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [showCreateNewChar, setShowCreateNewChar] = useState(false);
  const [activeGameId, setActiveGameId] = useState("");

  const onCreateNewChar = (e: React.MouseEvent) => {
    void router.push("/create-character");
  };

  const choseCharacter = (
    e: React.MouseEvent,
    character: {
      characterId: string;
      name: string;
      imgSrc: string;
      controllerId: string;
    },
    gameId: string
  ) => {
    addCharacterToGame.mutate({
      characterId: character.characterId,
      positionX: 0,
      positionY: 0,
      initiative: 0,
      gameId: gameId,
    }),
      {
        onSuccess: (response: Response) => {
          void router.push({
            pathname: "/playing",
            query: { data: gameId },
          }); // if successful go to game
        },
      },
      {
        onError: (error: Error) => {
          console.error("An error occurred:", error);
        },
      };
  };

  // Join game
  const handleOnJoin = (e: React.MouseEvent, gameId: string) => {
    if (!currentUser?.id || !charsWithGameId || !characters) return;

    setActiveGameId(gameId);

    if (characters.length < 1) {
      // MODAL POP UP TELLING USER TO CREATE A CHARACTER BEFORE JOINING
      setShowCreateNewChar(true);
    }

    // Check if user has a character there
    const charactersInGame = charsWithGameId.filter(
      (data) => data.gameId === gameId
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
              <button onClick={onCreateNewChar}> create new character</button>
            </>
          ) : (
            <>
              {"You have no characters in this game."}
              <br />
              {"Choose a character to play with. "}
              {characters?.map((character) => {
                return (
                  <div
                    key={character.characterId}
                    onClick={(e) => choseCharacter(e, character, activeGameId)}
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
