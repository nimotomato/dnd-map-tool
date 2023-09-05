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
      <h1>Active games</h1>
      {/* Get API call for all games where user */}
      <ul>
        <li>Game 1...</li>
        <li>Game 2...</li>
      </ul>
      <Link href="/">Go back</Link>
    </>
  );
};

export default ActiveGames;
