import { defineCard } from "../define.js";

const MILL_TEXT = "At the beginning of your upkeep, mill two cards.";
const RETURN_TEXT = "{1}{B}{G}, Exile this creature: Return target card from your graveyard to your hand.";

export default defineCard({
  name: "Nyx Weaver",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  types: ["enchantment", "creature"],
  subtypes: ["Spider"],
  power: 2,
  toughness: 3,
  keywords: ["reach"],
  text: `Reach\n${MILL_TEXT}\n${RETURN_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 2 },
      resolve: null,
      text: MILL_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{B}{G}", tap: false, exileSelf: true },
      targets: [{ kind: "card-in-graveyard", whose: "you" }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
