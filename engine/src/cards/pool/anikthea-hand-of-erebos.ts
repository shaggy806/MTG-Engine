import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// #171 in top-commanders.txt.
//
// The token copies the exiled card, with the exceptions part of its copiable
// values (rule 707.9b): a 3/3 black Zombie creature besides the card's own
// types, over which every other effect applies — and which a copy of the
// token copies too.
const GRANT_TEXT = "Other enchantment creatures you control have menace.";
const COPY_TEXT =
  "Whenever Anikthea enters or attacks, exile up to one target non-Aura enchantment card from your graveyard. " +
  "Create a token that's a copy of that card, except it's a 3/3 black Zombie creature in addition to its other types.";

const EXILE_AND_COPY: EffectSpec = {
  kind: "sequence",
  effects: [
    { kind: "exile", target: 0 },
    {
      kind: "create-token-copy",
      of: 0,
      count: 1,
      who: "you",
      exceptions: { basePt: [3, 3], setColors: ["B"], addTypes: ["creature"], addSubtypes: ["Zombie"] },
    },
  ],
};
const TARGET = {
  kind: "optional",
  of: { kind: "card-in-graveyard", whose: "you", filter: { type: "enchantment", notSubtypes: ["Aura"] } },
} as const;

export default defineCard({
  name: "Anikthea, Hand of Erebos",
  manaCost: "{2}{W}{B}{G}",
  colors: ["W", "B", "G"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["Demigod"],
  power: 4,
  toughness: 4,
  keywords: ["menace"],
  text: `Menace\n${GRANT_TEXT}\n${COPY_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { types: ["enchantment", "creature"], controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["menace"],
      text: GRANT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [TARGET],
      effect: EXILE_AND_COPY,
      resolve: null,
      text: COPY_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [TARGET],
      effect: EXILE_AND_COPY,
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
