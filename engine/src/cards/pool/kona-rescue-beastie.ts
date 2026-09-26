import { defineCard } from "../define.js";

// #206 in top-commanders.txt.
//
// "Your second main phase" is the postcombat main phase that is the turn's
// second, not a third or later one; "if Kona is tapped" is the intervening-if,
// checked again on resolution (Kona as it last existed if it has left). An
// Aura put onto the battlefield this way chooses what it enchants as it
// enters (rule 303.4f).
const SURVIVAL_TEXT =
  "Survival — At the beginning of your second main phase, if Kona is tapped, you may put a permanent card from " +
  "your hand onto the battlefield.";

export default defineCard({
  name: "Kona, Rescue Beastie",
  manaCost: "{3}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Beast", "Survivor"],
  power: 4,
  toughness: 3,
  text: SURVIVAL_TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "postcombat-main", who: "you" },
      condition: {
        kind: "all",
        of: [
          { kind: "turn-structure", mainPhase: 2 },
          { kind: "source", filter: { tapped: true } },
        ],
      },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"] },
      },
      resolve: null,
      text: SURVIVAL_TEXT,
    },
  ],
});
