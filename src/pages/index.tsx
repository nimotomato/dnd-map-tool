import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import font from "next/font/local";
import styles from "./Header.module.css";
const dndLogo = "/img/dnd.png";
const torch = "/img/torch.gif";

export default function Home() {
  const session = useSession();
  const user = session.data?.user;

  return (
    <>
      <main className="justify-top flex min-h-screen flex-col items-center bg-stone-950">
        {user != null ? (
          <>
            <div className="mb-32 mt-20 flex h-52 flex-col items-center justify-center">
              <img src={dndLogo} width={800} />
              <h2 className="text-2xl text-slate-200"> - online map tool</h2>
            </div>
            <h2 className="pb-12 text-xl text-slate-200">{`Welcome ${user.name}!`}</h2>
            <div className="w-42 relative flex gap-52">
              <img src={torch} />
              <div
                className="absolute z-50 h-20 w-12 translate-y-36 bg-none"
                style={{
                  boxShadow: "10px -190px 100px #fde047",
                  color: "rgba(0, 0, 0, 0)",
                }}
              >
                flame
              </div>
              <ul className=" flex h-40 w-full flex-col items-center justify-center gap-2 rounded border-8 border-double border-stone-500 bg-stone-800 font-light">
                <li className="w-full bg-stone-600 pl-6 pr-6 hover:bg-stone-700">
                  <Link href="/new-game">Start new game</Link>
                </li>
                <li className="w-full bg-stone-600 pl-6 pr-6 hover:bg-stone-700">
                  <Link href="/active-games">See active games</Link>
                </li>
                <li className="w-full bg-stone-600 pl-6 pr-6 hover:bg-stone-700">
                  <Link href="/create-character">Create character</Link>
                </li>
                <li className="w-full bg-stone-600 pl-6 pr-6 hover:bg-stone-700">
                  <Link href="/characters">Characters</Link>
                </li>
              </ul>
              <img src={torch} />
              <div
                className="justify-right absolute z-50 h-20 w-12 translate-y-36 bg-none"
                style={{
                  boxShadow: "-10px -190px 100px #fde047",
                  color: "rgba(0, 0, 0, 0)",
                  right: "0",
                }}
              >
                flame
              </div>
            </div>
            <button className="text-slate-200" onClick={() => void signOut()}>
              Log out
            </button>
          </>
        ) : (
          <>
            <button className="text-slate-200" onClick={() => void signIn()}>
              Log in
            </button>
          </>
        )}
      </main>
    </>
  );
}
