import { defineCard } from "../define.js";

const TRIGGER_TEXT =
  "Whenever this creature deals combat damage to a player, proliferate. (Choose any number of permanents " +
  "and/or players, then give each another counter of each kind already there.)";

export default defineCard({
  name: "Bloated Contaminator",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Beast"],
  power: 4,
  toughness: 4,
  keywords: ["trample"],
  toxic: 1,
  text: `Trample\nToxic 1 (Players dealt combat damage by this creature also get a poison counter.)\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
