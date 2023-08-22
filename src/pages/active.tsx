import Link from "next/link";

const ActiveGames = () => {
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
