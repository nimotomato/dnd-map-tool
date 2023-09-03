import { string } from "zod";

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
  height: number;
  width: number;
  zoom: number;
  spriteSize: number;
};

export type MapProps = {
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
  id: string;
  name: string;
  map: DbMapProps;
  players: string[];
  isPaused: boolean;
  dungeonMaster: string;
  characters: Character[];
};

export type Character = {
  name: string;
  posX: number;
  posY: number;
  imgSrc: string;
  initiative: number;
  controller: string;
  gameId: string;
};
