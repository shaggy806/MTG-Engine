import { defineCard } from "../define.js";

// The land is put onto the battlefield untapped; with the target gone the
// spell doesn't resolve, land and all (rule 608.2b).
export default defineCard({
  name: "Broken Bond",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Destroy target artifact or enchantment. You may put a land card from your hand onto the battlefield.",
  targets: ["artifact-or-enchantment"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "land" },
      },
    ],
  },
});
