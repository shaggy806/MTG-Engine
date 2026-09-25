import { defineCard } from "../define.js";

export default defineCard({
  name: "Reviving Melody",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Choose one or both —\n• Return target creature card from your graveyard to your hand.\n• Return target enchantment card from your graveyard to your hand.",
  castModal: {
    minModes: 1,
    maxModes: 2,
    modes: [
      {
        text: "Return target creature card from your graveyard to your hand.",
        targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      {
        text: "Return target enchantment card from your graveyard to your hand.",
        targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "enchantment" } }],
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
    ],
  },
});
