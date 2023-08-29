export type Spriteinfo = {
  name: string;
  posX: number;
  posY: number;
  height: number;
  width: number;
  imgSrc: string;
  controller: string;
};

export type MapProps = {
  imgSrc: string;
  posX: number;
  posY: number;
  height: number;
  width: number;
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
  name?: string;
  mapSrc?: string;
  mapPosX: number;
  mapPosY: number;
  players?: string[];
  dungeonMaster?: string;
};

export type Character = {
  name: string;
  posX: number;
  posY: number;
  imgSrc: string;
  initiative: number;
  controller: string;
};
