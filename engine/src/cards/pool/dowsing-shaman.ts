import { defineCard } from "../define.js";

export default defineCard({
  name: "Dowsing Shaman",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Centaur", "Shaman"],
  power: 3,
  toughness: 4,
  text: "{2}{G}, {T}: Return target enchantment card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: "{2}{G}", tap: true },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "enchantment" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{2}{G}, {T}: Return target enchantment card from your graveyard to your hand.",
    },
  ],
});
