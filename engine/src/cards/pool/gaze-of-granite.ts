import { defineCard } from "../define.js";

/** "Mana value X or less" reads this spell's X; a permanent with {X} in its
 * own mana cost counts that X as 0 (rule 107.3g). */
export default defineCard({
  name: "Gaze of Granite",
  manaCost: "{X}{B}{B}{G}",
  colors: ["B", "G"],
  types: ["sorcery"],
  text: "Destroy each nonland permanent with mana value X or less.",
  effect: {
    kind: "destroy-all",
    filter: { notTypes: ["land"], manaValue: { op: "lte", n: "x" } },
  },
});
