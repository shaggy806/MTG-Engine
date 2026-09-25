import { defineCard } from "../define.js";

// #168 in top-commanders.txt.
const ABILITY_TEXT =
  "{3}, {T}: Draw a card for each experience counter you have, then discard a card. Atreus deals " +
  "2 damage to each opponent.";

export default defineCard({
  name: "Atreus, Impulsive Son",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["God", "Archer"],
  power: 2,
  toughness: 4,
  keywords: ["reach"],
  pairing: { kind: "partner-group", group: "Father & son" },
  text:
    `Reach\n${ABILITY_TEXT}\n` +
    "Partner—Father & son (You can have two commanders if both have this ability.)",
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: { playerCounters: "experience" } },
          { kind: "discard", target: "you", amount: 1 },
          { kind: "damage", amount: 2, who: "each-opponent" },
        ],
      },
      resolve: null,
      text: ABILITY_TEXT,
    },
  ],
});
