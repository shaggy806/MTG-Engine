import { defineCard } from "../define.js";

const GRANT = {
  kind: "sequence",
  effects: [
    { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" },
    { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" },
  ],
} as const;

const TEXT =
  "Whenever Bruse Tarl, Boorish Herder enters or attacks, target creature you control gains " +
  "double strike and lifelink until end of turn.";

export default defineCard({
  name: "Bruse Tarl, Boorish Herder",
  manaCost: "{2}{R}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Ally"],
  power: 3,
  toughness: 3,
  pairing: { kind: "partner" },
  text: `${TEXT}\nPartner (You can have two commanders if both have partner.)`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: GRANT,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["creature-you-control"],
      effect: GRANT,
      resolve: null,
      text: TEXT,
    },
  ],
});
