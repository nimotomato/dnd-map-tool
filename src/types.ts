export type Spriteinfo = {
  name: string;
  posX: number;
  posY: number;
  height: string;
  width: string;
  imgSrc: string;
  controller: string;
};

export type MapProps = {
  imgSrc: string;
  posX: number;
  posY: number;
  height: string;
  width: string;
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
