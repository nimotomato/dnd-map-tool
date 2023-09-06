import Link from "next/link";
import { useSession } from "next-auth/react";

import { api } from "~/utils/api";

const ActiveGames = () => {
  const session = useSession();
  const user = session.data?.user;

  // Get all games a user is in.
  const games = api.game.getGames.useQuery({ userId: user?.id || "" });

  console.log(games.data);

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-600">
        <h1>Active games</h1>
        {/* Get API call for all games where user */}
        {games?.data && games.data.length > 0 ? (
          <ul>
            {games.data.map((game) => {
              return (
                <div>
                  <li>{game.gameId}</li>;<button className="">Join game</button>
                </div>
              );
            })}
          </ul>
        ) : (
          <h2> No active games found. </h2>
        )}
        <ul></ul>
        <Link href="/">Go back</Link>
      </main>
    </>
  );
};

export default ActiveGames;
