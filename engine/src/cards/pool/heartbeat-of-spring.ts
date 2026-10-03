import { defineCard } from "../define.js";

const TEXT = "Whenever a player taps a land for mana, that player adds one mana of any type that land produced.";

// Mana Flare's ability, in green — see there.
export default defineCard({
  name: "Heartbeat of Spring",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: TEXT,
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
