import { defineCard } from "../define.js";

export default defineCard({
  name: "Dawn to Dusk",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Choose one or both —\n• Return target enchantment card from your graveyard to your hand.\n• Destroy target enchantment.",
  castModal: {
    minModes: 1,
    maxModes: 2,
    modes: [
      {
        text: "Return target enchantment card from your graveyard to your hand.",
        targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "enchantment" } }],
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      {
        text: "Destroy target enchantment.",
        targets: ["enchantment"],
        effect: { kind: "destroy", target: 0 },
      },
    ],
  },
});
