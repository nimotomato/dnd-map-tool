import Link from "next/link";

const NewGame = () => {
  return (
    <>
      <h1>Starting?</h1>
      <form>
        <ul>
          <li>Choose map</li>
          <li>Invite players</li>
          <li>Place characters</li>
          <li>Start game</li>
        </ul>
      </form>
      <Link href="/">Go back</Link>
    </>
  );
};

export default NewGame;
