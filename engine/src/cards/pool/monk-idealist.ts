import { defineCard } from "../define.js";

export default defineCard({
  name: "Monk Idealist",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Monk", "Cleric"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, return target enchantment card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "enchantment" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "When this creature enters, return target enchantment card from your graveyard to your hand.",
    },
  ],
});
