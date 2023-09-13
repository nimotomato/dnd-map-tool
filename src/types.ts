export type DbMapProps = {
  imgSrc: string;
  posX: number;
  posY: number;
  zoom: number;
  spriteSize: number;
};

export type MapProps = {
  positionX: number;
  positionY: number;
  zoom: number;
  hasLoaded: boolean;
};

export type Maprect = {
  x: number;
  y: number;
  width: number;
  height: number;
  fullWidth: number;
  fullHeight: number;
};

export type Game = {
  id: string;
  name: string;
  map: DbMapProps;
  players: { name: string; id: string }[];
  isPaused: boolean;
  dungeonMaster: string;
  characters: Character[];
  turnIndex: number;
};

export type Character = {
  characterId: string;
  name: string;
  positionX: number;
  positionY: number;
  imgSrc: string;
  initiative: number;
  controllerId: string;
  isDead: boolean;
};
