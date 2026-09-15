import { defineCard } from "../define.js";

// Every mode is a mass effect with no targets, so the modes are chosen as the
// spell resolves (the `modal` `EffectSpec`) rather than at cast time.
export default defineCard({
  name: "Austere Command",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text:
    "Choose two —\n" +
    "• Destroy all artifacts.\n" +
    "• Destroy all enchantments.\n" +
    "• Destroy all creatures with mana value 3 or less.\n" +
    "• Destroy all creatures with mana value 4 or greater.",
  effect: {
    kind: "modal",
    minModes: 2,
    maxModes: 2,
    modes: [
      { text: "Destroy all artifacts.", effect: { kind: "destroy-all", filter: { type: "artifact" } } },
      {
        text: "Destroy all enchantments.",
        effect: { kind: "destroy-all", filter: { type: "enchantment" } },
      },
      {
        text: "Destroy all creatures with mana value 3 or less.",
        effect: {
          kind: "destroy-all",
          filter: { type: "creature", manaValue: { op: "lte", n: 3 } },
        },
      },
      {
        text: "Destroy all creatures with mana value 4 or greater.",
        effect: {
          kind: "destroy-all",
          filter: { type: "creature", manaValue: { op: "gte", n: 4 } },
        },
      },
    ],
  },
});
