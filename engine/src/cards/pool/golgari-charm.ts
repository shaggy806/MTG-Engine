import { defineCard } from "../define.js";

export default defineCard({
  name: "Golgari Charm",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  types: ["instant"],
  text:
    "Choose one —\n" +
    "• All creatures get -1/-1 until end of turn.\n" +
    "• Destroy target enchantment.\n" +
    "• Regenerate each creature you control.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "All creatures get -1/-1 until end of turn.",
        effect: { kind: "modify-pt-all", filter: { type: "creature" }, power: -1, toughness: -1, duration: "end-of-turn" },
      },
      {
        text: "Destroy target enchantment.",
        targets: [{ kind: "permanent", filter: { type: "enchantment" } }],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Regenerate each creature you control.",
        effect: { kind: "regenerate-all", filter: { type: "creature", controlledBy: "you" } },
      },
    ],
  },
});
