import { defineCard } from "../define.js";

export default defineCard({
  name: "Archon of Falling Stars",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Archon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nWhen this creature dies, you may return target enchantment card from your graveyard to the battlefield.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "enchantment" } }],
      effect: {
        kind: "may",
        prompt: "Return target enchantment card from your graveyard to the battlefield?",
        effect: { kind: "put-onto-battlefield", target: 0 },
      },
      resolve: null,
      text: "When this creature dies, you may return target enchantment card from your graveyard to the battlefield.",
    },
  ],
});
