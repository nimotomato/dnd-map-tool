export type Spriteinfo = {
  name: string;
  posX: number;
  posY: number;
  height: number;
  width: number;
  imgSrc: string;
  controller: string;
};

export type DbMapProps = {
  imgSrc: string;
  posX: number;
  posY: number;
  zoom: number;
  spriteSize: number;
};

export type MapProps = {
  posX: number;
  posY: number;
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
};

export type Character = {
  id?: string;
  name: string;
  positionX: number;
  positionY: number;
  imgSrc: string;
  initiative: number;
  controllerId: string;
  gameId: string;
};
