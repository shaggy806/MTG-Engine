import { defineCard } from "../define.js";

// #209 in top-commanders.txt.
//
// Chaos Control grants split second to your spells paid for in part with
// artifact mana (`manaFrom`, read off where each unit came from as it was
// made — a Treasure sacrificed for it was still a Treasure).
const DRAW_TEXT = "Whenever Shadow the Hedgehog or another creature you control with flash or haste dies, draw a card.";
const CHAOS_TEXT =
  "Chaos Control — Each spell you cast has split second if mana from an artifact was spent to cast it. " +
  "(As long as it's on the stack, players can't cast spells or activate abilities that aren't mana abilities.)";

export default defineCard({
  name: "Shadow the Hedgehog",
  manaCost: "{B}{B}{R}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Hedgehog", "Mercenary"],
  power: 4,
  toughness: 2,
  keywords: ["haste"],
  text: `Haste\n${DRAW_TEXT}\n${CHAOS_TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
    {
      trigger: {
        on: "dies",
        who: "you-control",
        otherOnly: true,
        filter: { type: "creature", anyOf: [{ keyword: "flash" }, { keyword: "haste" }] },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      grantsToSpells: { filter: { manaFrom: { type: "artifact" } }, splitSecond: true },
      text: CHAOS_TEXT,
    },
  ],
});
