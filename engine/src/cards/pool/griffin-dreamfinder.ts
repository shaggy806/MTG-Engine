import { defineCard } from "../define.js";

export default defineCard({
  name: "Griffin Dreamfinder",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Griffin"],
  power: 1,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, return target enchantment card from your graveyard to your hand.",
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
