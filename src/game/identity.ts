import { STRINGS } from "../strings";

export interface Identity {
  name: string;
  image: string;
}

const ORIGINAL: Identity = { name: STRINGS.identities.original, image: "images/identities/jensen.png" };

const DISGUISE_IDS = ["beard", "detective", "blonde", "monopoly", "mustache", "propeller"] as const;
const imageOf = (id: string) => `images/identities/${id}.png`;

let current: Identity = ORIGINAL;
let unusedDisguises: string[] = [];
let unusedAliases: string[] = [];

function draw<T>(bag: T[], refill: () => T[], avoid?: T): T {
  if (bag.length === 0) bag.push(...refill());
  const options = bag.filter((item) => item !== avoid);
  const picked = (options.length > 0 ? options : bag)[Math.floor(Math.random() * (options.length > 0 ? options : bag).length)]!;
  bag.splice(bag.indexOf(picked), 1);
  return picked;
}

export function currentIdentity(): Identity {
  return current;
}

export function nextIdentity(): Identity {
  const id = draw(unusedDisguises, () => [...DISGUISE_IDS], DISGUISE_IDS.find((disguise) => imageOf(disguise) === current.image));
  const name = id === "blonde" ? STRINGS.identities.blonde : draw(unusedAliases, () => [...STRINGS.identities.aliases], current.name);
  current = { name, image: imageOf(id) };
  return current;
}

export function allIdentityImages(): string[] {
  return [ORIGINAL.image, ...DISGUISE_IDS.map(imageOf)];
}
