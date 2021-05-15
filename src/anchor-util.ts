import anchors from './anchors.json';

export type Anchor = typeof anchors[0];

export const toLastPath = (a: Anchor) => a.filename.split('.')[0];

export const toLastPathWithHash = (a: Anchor) => `${toLastPath(a)}#${a.hash}`;
