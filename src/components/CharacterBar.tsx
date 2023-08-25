import { Spriteinfo } from "~/types";
import Sprite from "./Sprite";

type Props = {
  sprites: Spriteinfo[];
  setSprites: React.Dispatch<React.SetStateAction<Spriteinfo[]>>;
};

const CharacterBar = ({ sprites, setSprites }: Props) => {
  return (
    <div className="flex flex-row">
      {sprites?.map((sprite) => {
        return <img src={sprite.imgSrc}></img>;
      })}
    </div>
  );
};

export default CharacterBar;
