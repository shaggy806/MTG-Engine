import { defineCard } from "../define.js";

// EDHREC rank 6190.
// Heartbeat of Spring's trigger, with flash.

const TEXT = "Whenever a player taps a land for mana, that player adds one mana of any type that land produced.";

export default defineCard({
  name: "Dictate of Karametra",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  keywords: ["flash"],
  text: `Flash\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "tapped-for-mana", who: "any", filter: { type: "land" } },
      targets: [],
      effect: { kind: "add-mana", mana: "produced", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
