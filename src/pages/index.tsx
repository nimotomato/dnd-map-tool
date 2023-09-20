import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import font from "next/font/local";
import styles from "./Header.module.css";
import { useRouter } from "next/router";

const dndLogo = "/img/dnd.png";
const torch = "/img/torch.gif";
const bg = "/img/bg2.png";

export default function Home() {
  const session = useSession();
  const user = session.data?.user;
  const router = useRouter();

  return (
    <>
      <main
        style={{
          backgroundImage: `url(${bg})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
        className="justify-top flex min-h-screen flex-col items-center bg-stone-950"
      >
        {user != null ? (
          <>
            <div className="mb-32 mt-20 flex h-52 flex-col items-center justify-center">
              <img src={dndLogo} width={800} />
              <h2 className="text-2xl text-slate-200"> online combat map </h2>
            </div>
            <h2 className="pb-12 text-xl text-slate-200">{`Welcome ${user.name}!`}</h2>
            <div className="w-42 relative flex gap-52">
              <img src={torch} />
              <div
                className="absolute h-20 w-12 translate-y-36 select-none bg-transparent"
                style={{
                  boxShadow: "10px -190px 100px #fde047",
                  color: "rgba(0, 0, 0, 0)",
                }}
              ></div>
              <ul className="h-42 flex w-full flex-col items-center justify-center gap-2 rounded border-8 border-double border-stone-500 bg-stone-800 px-2 py-2 text-center font-light ">
                <li
                  onClick={() => void router.push("/new-game")}
                  className="w-full bg-stone-600 pl-6 pr-6 hover:cursor-pointer hover:bg-stone-700"
                >
                  <p>Start new game</p>
                </li>
                <li
                  onClick={() => void router.push("/active-games")}
                  className="w-full bg-stone-600 pl-6 pr-6 hover:cursor-pointer hover:bg-stone-700"
                >
                  <p>Active games</p>
                </li>
                <li
                  onClick={() => void router.push("/create-character")}
                  className="w-full bg-stone-600 pl-6 pr-6 hover:cursor-pointer hover:bg-stone-700"
                >
                  <p>Create character</p>
                </li>
                <li
                  onClick={() => void router.push("/characters")}
                  className="w-full bg-stone-600 pl-6 pr-6 hover:cursor-pointer hover:bg-stone-700"
                >
                  <p>Characters</p>
                </li>
                <li
                  onClick={() => void signOut()}
                  className="w-full bg-stone-600 pl-6 pr-6 hover:cursor-pointer hover:bg-stone-700"
                >
                  <p>Log out</p>
                </li>
              </ul>
              <img src={torch} />
              <div
                className="justify-right absolute h-20 w-12 translate-y-36 select-none bg-transparent"
                style={{
                  boxShadow: "-10px -190px 100px #fde047",
                  color: "rgba(0, 0, 0, 0)",
                  right: "0",
                }}
              ></div>
            </div>
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
