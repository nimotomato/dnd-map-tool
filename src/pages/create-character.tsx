import { useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/utils/api";
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import useTryLoadImg from "~/hooks/useTryLoadImg";

export default function CreateCharacter() {
  const session = useSession();
  const currentUser = session.data?.user;

  const [imgInput, setImgInput] = useState("");
  const [characterName, setCharacterName] = useState("");

  const imgHasError = useTryLoadImg(imgInput);

  const createCharacter = api.character.postCharacter.useMutation();

  const handleCreate = (e: React.MouseEvent) => {
    if (!currentUser) {
      alert("Invalid user id");
      return;
    }

    if (characterName == "") {
      alert("No name selected. ");
      return;
    }

    if (characterName.length < 2) {
      alert("Name is too short.");
      return;
    }

    if (imgHasError) {
      alert("Invalid image source");
      return;
    }

    createCharacter.mutate({
      controllerId: currentUser.id,
      characterId: uuidv4(),
      name: characterName,
      imgSrc: imgInput,
    });

    setCharacterName("");
    setImgInput("");
  };

  return (
    <>
      <Head>
        <title>DND map</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-600">
        <div className="flex flex-col">
          <div className="">
            {!imgHasError ? (
              <div className="w-48 border-2 border-solid border-slate-800">
                <img src={imgInput} className="h-full" alt="Character" />{" "}
              </div>
            ) : (
              <div className="h-52 w-48 border-2 border-solid border-slate-800"></div>
            )}
            <label>
              Character name <br />
              <input
                type="text"
                className="w-48"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
              />
            </label>
          </div>
          <div>
            <label>
              Character image source <br />
              <input
                type="text"
                className="w-48"
                value={imgInput}
                onChange={(e) => setImgInput(e.target.value)}
              />
            </label>
          </div>
          <button onClick={handleCreate}>Create character</button>
        </div>

        <Link href="/">Go back</Link>
      </main>
    </>
  );
}
