import Link from "next/link";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { api } from "~/utils/api";
import { useRef } from "react";
const charactersBanner = "/img/characters.png";
const torch = "/img/torch.gif";

const Characters = () => {
  const session = useSession();
  const currentUser = session.data?.user;
  const placeHolderNamesRef = useRef(["1", "2", "3", "4", "5"]);

  // Get all characters of a .
  const characters = api.character.getCharactersOfUser.useQuery({
    userId: currentUser?.id ?? "",
  });

  // Remove character
  const removeUser = api.character.deleteCharacter.useMutation();

  // Delete character
  const handleOnDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    removeUser.mutate({ characterId: id });
    void characters.refetch();
  };

  return (
    <>
      <main className="justify-top flex min-h-screen flex-col items-center bg-stone-950 text-slate-200">
        <div className="mb-32 mt-20 flex h-52 flex-col items-center justify-center">
          <img src={charactersBanner} width={300} />
        </div>
        <div className="w-46 relative flex h-4/5 gap-52">
          <img src={torch} style={{ height: 120 }} />
          <div
            className="absolute h-20 w-12 translate-y-36 select-none bg-transparent"
            style={{
              boxShadow: "10px -190px 100px #fde047",
              color: "rgba(0, 0, 0, 0)",
            }}
          />
          {/* Get API call for all games where user */}
          {characters?.data && characters.data.length > 0 ? (
            <ul className="flex h-full flex-col items-center justify-start gap-4 overflow-y-auto rounded border-8 border-double border-stone-500 bg-stone-800 px-6 py-4  text-center font-light ">
              {characters.data
                .filter(
                  (character) =>
                    !placeHolderNamesRef.current.includes(character.name)
                ) // Filter out placeholder characters
                .map((character) => {
                  return (
                    <div
                      className="rounded border-2 border-stone-600 bg-stone-900"
                      key={character.characterId}
                    >
                      <li className="m-3 flex flex-col text-slate-200">
                        {<img className="w-24" src={character.imgSrc}></img>}
                        {character.name}
                        <button
                          onClick={(e) =>
                            handleOnDelete(e, character.characterId)
                          }
                        >
                          Delete
                        </button>
                      </li>
                    </div>
                  );
                })}
            </ul>
          ) : (
            <h2> No characters found. </h2>
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

export default Characters;
