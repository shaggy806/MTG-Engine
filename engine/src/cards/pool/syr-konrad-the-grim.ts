import { defineCard } from "../define.js";

// #493 in top-commanders.txt.
//
// One printed ability with three events: another creature dying, a creature
// card reaching any graveyard from anywhere but the battlefield (once per
// card), and a creature card leaving your graveyard (once per card).
const TEXT =
  "Whenever another creature dies, or a creature card is put into a graveyard from anywhere other than " +
  "the battlefield, or a creature card leaves your graveyard, Syr Konrad deals 1 damage to each opponent.";
const MILL_TEXT = "{1}{B}: Each player mills a card.";
const ping = { kind: "damage", amount: 1, who: "each-opponent" } as const;

export default defineCard({
  name: "Syr Konrad, the Grim",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 5,
  toughness: 4,
  text: `${TEXT}\n${MILL_TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "any", otherOnly: true, filter: { type: "creature" } },
      targets: [],
      effect: ping,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "put-into-graveyard", who: "any", notFrom: "battlefield", filter: { type: "creature" } },
      targets: [],
      effect: ping,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "leaves-graveyard", who: "you", perCard: true, filter: { type: "creature" } },
      targets: [],
      effect: ping,
      resolve: null,
      text: TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{B}", tap: false },
      targets: [],
      effect: { kind: "mill", target: "each-player", amount: 1 },
      resolve: null,
      text: MILL_TEXT,
    },
  ],
});
