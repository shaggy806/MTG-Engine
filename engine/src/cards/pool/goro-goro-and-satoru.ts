import { defineCard } from "../define.js";

// #317 in top-commanders.txt.
const DRAGON_TEXT =
  "Whenever one or more creatures you control that entered this turn deal combat damage to a player, " +
  "create a 5/5 red Dragon Spirit creature token with flying.";
const HASTE_TEXT = "{1}{R}: Creatures you control gain haste until end of turn.";

export default defineCard({
  name: "Goro-Goro and Satoru",
  manaCost: "{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Goblin", "Human"],
  power: 3,
  toughness: 4,
  text: `${DRAGON_TEXT}\n${HASTE_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "deals-damage-batch",
        who: "you-control",
        filter: { type: "creature", enteredThisTurn: true },
        combat: true,
      },
      targets: [],
      effect: { kind: "create-token", token: "Dragon Spirit Token", count: 1 },
      resolve: null,
      text: DRAGON_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{R}", tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "haste",
        duration: "end-of-turn",
      },
      resolve: null,
      text: HASTE_TEXT,
    },
  ],
});
