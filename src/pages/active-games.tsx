import Link from "next/link";
import { useSession } from "next-auth/react";
import Head from "next/head";

import { api } from "~/utils/api";

const ActiveGames = () => {
  const session = useSession();
  const user = session.data?.user;

  // Get all games a user is in.
  const games = api.game.getGames.useQuery({ userId: user?.id ?? "" });

  return (
    <>
      <Head>
        <title>DND map</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-600">
        <h1>Active games</h1>
        {/* Get API call for all games where user */}
        {games?.data && games.data.length > 0 ? (
          <ul>
            {games.data.map((game) => {
              return (
                <div key={game.gameId}>
                  <li>
                    {game.game.name}{" "}
                    <Link
                      href={{
                        pathname: "/playing",
                        query: { data: JSON.stringify(game.gameId) },
                      }}
                    >
                      Join game
                    </Link>
                    <button className="">Leave game</button>
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
