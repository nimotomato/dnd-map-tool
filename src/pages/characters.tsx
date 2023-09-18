import Link from "next/link";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { api } from "~/utils/api";
import { useRef } from "react";
const charactersBanner = "/img/characters.png";

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
      <main className="flex min-h-screen flex-col items-center justify-center bg-stone-950">
        <div className="flex h-52 flex-col items-center justify-center">
          <img src={charactersBanner} width={350} />
        </div>
        {/* Get API call for all games where user */}
        {characters?.data && characters.data.length > 0 ? (
          <ul>
            {characters.data
              .filter(
                (character) =>
                  !placeHolderNamesRef.current.includes(character.name)
              ) // Filter out placeholder characters
              .map((character) => {
                return (
                  <div key={character.characterId}>
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
        <Link className="text-slate-200" href="/">
          Go back
        </Link>
      </main>
    </>
  );
};

export default Characters;
