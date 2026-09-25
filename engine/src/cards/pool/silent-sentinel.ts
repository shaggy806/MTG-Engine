import { defineCard } from "../define.js";

export default defineCard({
  name: "Silent Sentinel",
  manaCost: "{5}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Archon"],
  power: 4,
  toughness: 6,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature attacks, you may return target enchantment card from your graveyard to the battlefield.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "enchantment" } }],
      effect: {
        kind: "may",
        prompt: "Return target enchantment card from your graveyard to the battlefield?",
        effect: { kind: "put-onto-battlefield", target: 0 },
      },
      resolve: null,
      text: "Whenever this creature attacks, you may return target enchantment card from your graveyard to the battlefield.",
    },
  ],
});
