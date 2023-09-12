import React, { useState, useRef, useEffect, SetStateAction } from "react";
import { FaX } from "react-icons/fa6";

type Props = {
  open: boolean;
  children: React.ReactNode;
  setClose: React.MouseEventHandler<HTMLButtonElement>;
};

const Modal = ({ open, setClose, children }: Props) => {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center transition-colors ${
        open ? "visible bg-black/30" : "invisible"
      }`}
    >
      <div
        className={`rounded-xl bg-slate-200 p-6 shadow transition-all ${
          open ? "scale-100 opacity-100" : "scale-125 opacity-0"
        }`}
      >
        <button
          onClick={setClose}
          className="absolute right-2 top-2 rounded-lg bg-white p-1 text-gray-500 hover:bg-gray-50 hover:text-gray-600"
        >
          <FaX />
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
