import Link from "next/link";
import { useSession } from "next-auth/react";
import Head from "next/head";

import { api } from "~/utils/api";

const Characters = () => {
  const session = useSession();
  const currentUser = session.data?.user;

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
      <Head>
        <title>DND map</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-600">
        <h1>Characters</h1>
        {/* Get API call for all games where user */}
        {characters?.data && characters.data.length > 0 ? (
          <ul>
            {characters.data.map((character) => {
              return (
                <div key={character.characterId}>
                  <li className="m-3 flex flex-col">
                    {<img className="w-24" src={character.imgSrc}></img>}
                    {character.name}
                    <button
                      onClick={(e) => handleOnDelete(e, character.characterId)}
                    >
                      delete
                    </button>
                  </li>
                </div>
              );
            })}
          </ul>
        ) : (
          <h2> No characters found. </h2>
        )}
        <Link href="/">Go back</Link>
      </main>
    </>
  );
};

export default Characters;
