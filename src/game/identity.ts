import { STRINGS } from "../strings";

export interface Identity {
  name: string;
  image: string;
}

const ORIGINAL: Identity = { name: STRINGS.identities.original, image: "/images/identities/jensen.png" };

const DISGUISES: Identity[] = (["beard", "detective", "blonde", "monopoly", "mustache", "propeller"] as const).map((id) => ({
  name: STRINGS.identities[id],
  image: `/images/identities/${id}.png`,
}));

let current: Identity = ORIGINAL;
let unused: Identity[] = [];

export function currentIdentity(): Identity {
  return current;
}

export function nextIdentity(): Identity {
  if (unused.length === 0) unused = [...DISGUISES];
  const options = unused.filter((identity) => identity !== current);
  const picked = options[Math.floor(Math.random() * options.length)]!;
  unused.splice(unused.indexOf(picked), 1);
  current = picked;
  return current;
}

export function allIdentityImages(): string[] {
  return [ORIGINAL, ...DISGUISES].map((identity) => identity.image);
}
