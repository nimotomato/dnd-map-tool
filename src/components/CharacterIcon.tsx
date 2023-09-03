import { Spriteinfo } from "~/types";
import Sprite from "./Sprite";

type Props = {
  sprites: Spriteinfo;
};

const CharacterBar = ({ sprite }: Props) => {
  return <div className="flex flex-row">{}</div>;
};

export default CharacterBar;
