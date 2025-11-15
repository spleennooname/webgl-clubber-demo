import Clubber from "clubber";

export const iMusicSub = [0.0, 0.0, 0.0, 0.0];
export const iMusicLow = [0.0, 0.0, 0.0, 0.0];
export const iMusicMid = [0.0, 0.0, 0.0, 0.0];
export const iMusicHigh = [0.0, 0.0, 0.0, 0.0];
export const smoothArray = [0.1, 0.1, 0.1, 0.1];
export const adaptArray = [0.5, 0.6, 1, 1];

export function createClubber(context, analyser) {
  return new Clubber({
    context,
    analyser,
  });
}

export function getClubberBands(clubber) {
  return {
    sub: clubber.band({
      template: "0123",
      from: 1,
      to: 32,
      /*  low: 1,
      high: 127, */
      smooth: smoothArray,
      adapt: adaptArray,
    }),

    low: clubber.band({
      template: "0123",
      from: 33,
      to: 48,
      /* low: 1,
      high:127, */
      smooth: smoothArray,
      adapt: adaptArray,
    }),

    mid: clubber.band({
      template: "0123",
      from: 49,
      to: 64,
      /*  low: 1,
      high: 127, */
      smooth: smoothArray,
      adapt: adaptArray,
    }),

    high: clubber.band({
      template: "0123",
      from: 65,
      to: 127,
      /* low: 1,
      high: 127, */
      smooth: smoothArray,
      adapt: adaptArray,
    }),
  };
}
