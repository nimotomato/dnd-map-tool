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
