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
  leashDistance: number;
};

export type Character = {
  characterId: string;
  name: string;
  positionX: number;
  prevPositionX: number;
  positionY: number;
  prevPositionY: number;
  imgSrc: string;
  initiative: number;
  controllerId: string;
  dexModifier: number;
  isDead: boolean;
};
