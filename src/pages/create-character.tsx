import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import useTryLoadImg from "~/hooks/useTryLoadImg";
import { useRouter } from "next/router";
import Modal from "~/components/Modal";
import { types } from "util";
const createchar = "/img/createchar.png";
const torch = "/img/torch.gif";
const bg = "/img/bg2.png";

export default function CreateCharacter() {
  const session = useSession();
  const currentUser = session.data?.user;
  const router = useRouter();

  const [imgInput, setImgInput] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [dexModInput, setDexModInput] = useState("");

  const imgHasError = useTryLoadImg(imgInput);

  const createCharacter = api.character.postCharacter.useMutation();

  const handleDexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (/^[0-9]*$/.test(e.target.value)) {
      setDexModInput(e.target.value);
    }
  };

  const handleCreate = (e: React.MouseEvent) => {
    if (!currentUser) {
      alert("Invalid user id");
      return;
    }

    if (characterName == "") {
      setErrorMessage("No name selected...");
      setModalIsOpen(true);
      return;
    }

    if (characterName.length < 2) {
      setErrorMessage("Name is too short...");
      setModalIsOpen(true);
      return;
    }

    if (imgHasError) {
      setErrorMessage("Invalid image source...");
      setModalIsOpen(true);
      return;
    }

    if (!dexModInput || Number(dexModInput) > 10) {
      setErrorMessage("Invalid dex input...");
      setModalIsOpen(true);
      return;
    }

    const input = {
      controllerId: currentUser.id,
      characterId: uuidv4(),
      name: characterName,
      imgSrc: imgInput,
      dexModifier: Number(dexModInput),
    };

    setCharacterName("");
    setImgInput("");
    setDexModInput("");

    createCharacter.mutate(input, {
      onSuccess: (data, variables, context) => {
        setErrorMessage("");
        setModalIsOpen(true);
      },
      onError: (data, variables, context) => {
        setErrorMessage(data.message);
        setModalIsOpen(true);
      },
    });
  };

  return (
    <>
      <Head>
        <title>Create Character</title>
      </Head>
      <main
        style={{
          backgroundImage: `url(${bg})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
        className="justify-top flex min-h-screen flex-col items-center bg-stone-950 text-slate-200"
      >
        <Modal open={modalIsOpen} setClose={() => setModalIsOpen(false)}>
          {!errorMessage ? (
            <h1 className="text-slate-800"> Character created! </h1>
          ) : (
            <h1 className="text-slate-800"> {errorMessage} </h1>
          )}
          <button
            onClick={() => void router.push("/")}
            className="border-3 m-2 rounded border-2 border-solid border-slate-400 bg-stone-600 pl-6 pr-6 hover:bg-stone-700"
          >
            Main Menu
          </button>
          <button
            onClick={() => setModalIsOpen(false)}
            className="border-3 m-2 rounded border-2 border-solid border-slate-400 bg-stone-600 pl-6 pr-6 hover:bg-stone-700"
          >
            Close
          </button>
        </Modal>
        <div className="mb-32 mt-20 flex h-52 flex-col items-center justify-center">
          <img src={createchar} width={500} />
        </div>
        <div className="w-46 relative flex gap-52">
          <img src={torch} style={{ height: 120 }} />
          <div
            className="absolute h-20 w-12 translate-y-36 select-none bg-transparent"
            style={{
              boxShadow: "10px -190px 100px #fde047",
              color: "rgba(0, 0, 0, 0)",
            }}
          />
          <div className="flex flex-col items-center justify-start gap-4 rounded border-8 border-double border-stone-500 bg-stone-800 px-6 py-4 text-center font-light">
            <div className="mt-2">
              {!imgHasError ? (
                <div className="w-48 border-2 border-solid border-slate-500">
                  <img src={imgInput} className="h-full" alt="Character" />{" "}
                </div>
              ) : (
                <div
                  className="h-52 w-48 border-2 border-solid
                border-slate-500"
                ></div>
              )}
            </div>
            <div>
              <label className="mt-4">
                Character name <br />
                <input
                  type="text"
                  className="w-48 rounded-sm border-2 border-stone-600 indent-1 text-slate-800"
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
                  className="w-48 rounded-sm border-2 border-stone-600 indent-1 text-slate-800"
                  value={imgInput}
                  onChange={(e) => setImgInput(e.target.value)}
                />
              </label>
            </div>
            <div>
              <label>
                Dexterity modifier <br />
                <input
                  type="text"
                  className="w-10 rounded-sm border-2 border-stone-600 indent-1 text-slate-800"
                  value={dexModInput}
                  onChange={handleDexInput}
                />
              </label>
            </div>
            <button
              className="z-10 mt-1 rounded border-2 border-solid border-slate-400 bg-stone-600 pb-1 pl-2 pr-2 pt-1 text-sm hover:bg-stone-700"
              onClick={handleCreate}
            >
              Create character
            </button>
          </div>
          <img src={torch} style={{ height: 120 }} />
          <div
            className="justify-right absolute h-20 w-12 translate-y-36 select-none bg-transparent"
            style={{
              boxShadow: "-10px -190px 100px #fde047",
              color: "rgba(0, 0, 0, 0)",
              right: "0",
            }}
          />
        </div>
        <Link
          className="border-3 m-2 rounded border-2 border-solid border-slate-400 bg-stone-600 pl-6 pr-6 hover:bg-stone-700"
          href="/"
        >
          Go back
        </Link>
      </main>
    </>
  );
}
