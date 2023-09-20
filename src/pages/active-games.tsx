import Link from "next/link";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import React, { useState, useRef } from "react";
import Modal from "~/components/Modal";
const gamesLogo = "/img/games.png";
const torch = "/img/torch.gif";
const bg = "/img/bg2.png";

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
        <title>Active Games</title>
      </Head>
      <main
        style={{
          backgroundImage: `url(${bg})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
        className="justify-top flex min-h-screen flex-col items-center bg-stone-950 text-slate-200"
      >
        <div className="mb-32 mt-20 flex h-52 flex-col items-center justify-center">
          <img src={gamesLogo} width={200} />
        </div>
        <Modal open={modalIsOpen} setClose={() => setModalIsOpen(false)}>
          <div className="h-auto w-56 items-center justify-center text-center"></div>
          {showCreateNewChar ? (
            <>
              <p className="text-stone-900">
                You have no characters, please create a new one before joining a
                game.
              </p>
              <br />
              <button onClick={onCreateNewChar}> create new character </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden">
              <p className="text-stone-900">
                You have no characters in this game.
              </p>
              <p className="text-stone-900">Choose a character to play with.</p>
              <br />
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
                      className="h-22 m-2 flex min-w-full flex-col items-center justify-center rounded-lg bg-slate-300 p-2 hover:bg-slate-400"
                    >
                      <img
                        src={`${character.imgSrc}`}
                        alt="char image"
                        className="h-16 w-16 p-2"
                      ></img>
                      <p className="text-stone-900">{`${character.name}`}</p>
                    </div>
                  );
                })}
            </div>
          )}
        </Modal>
        <div className="w-46 relative flex gap-52">
          <img src={torch} style={{ height: 120 }} />
          <div
            className="absolute h-20 w-12 translate-y-36 select-none bg-transparent"
            style={{
              boxShadow: "10px -190px 100px #fde047",
              color: "rgba(0, 0, 0, 0)",
            }}
          />
          {games?.data && games.data.length > 0 ? (
            <ul className="flex h-52 flex-col items-center justify-start gap-2 overflow-y-auto rounded border-8 border-double border-stone-500 bg-stone-800 px-6 py-4  text-center font-light ">
              {games.data.map((game) => {
                return (
                  <div
                    className="grid grid-cols-4 items-center gap-1 text-center"
                    key={game.Game.gameId}
                  >
                    <p className="w-full rounded bg-slate-900 py-1">
                      {game.Game.name}
                    </p>

                    <button
                      onClick={(e) => handleOnJoin(e, game.Game.gameId)}
                      className="z-10 rounded border-2 border-solid border-slate-400 bg-stone-600 px-2 pb-1 pt-1 text-sm hover:bg-stone-700"
                    >
                      Join game
                    </button>

                    <button
                      onClick={(e) => handleOnLeave(e, game.Game.gameId)}
                      className="z-10 rounded border-2 border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 text-sm hover:bg-stone-700"
                    >
                      Leave game
                    </button>

                    {game.Game.dungeonMasterId === currentUser?.id && (
                      <button
                        className="z-10 rounded border-2 border-solid border-slate-400 bg-stone-600 py-1 text-sm hover:bg-stone-700"
                        onClick={(e) => handleOnDelete(e, game.Game.gameId)}
                      >
                        Delete game
                      </button>
                    )}
                  </div>
                );
              })}
            </ul>
          ) : (
            <h2> No active games found. </h2>
          )}
          <img src={torch} style={{ height: 120 }} />
          <div
            className="justify-right absolute h-20 w-12 translate-y-36 select-none bg-transparent"
            style={{
              boxShadow: "-10px -190px 100px #fde047",
              color: "rgba(0, 0, 0, 0)",
              right: "0",
            }}
          />
        </div>

        <Link
          className="border-3 m-2 rounded border-2 border-solid border-slate-400 bg-stone-600 pl-6 pr-6 hover:bg-stone-700"
          href="/"
        >
          Go back
        </Link>
      </main>
    </>
  );
};

export default ActiveGames;
