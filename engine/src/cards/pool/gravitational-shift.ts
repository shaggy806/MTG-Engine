import { defineCard } from "../define.js";

export default defineCard({
  name: "Gravitational Shift",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "Creatures with flying get +2/+0.\nCreatures without flying get -2/-0.",
  static: [
    {
      // "**Creatures**", unqualified — everyone's, which is what the
      // `all-creatures` scope is for.
      affects: { scope: "all-creatures", withKeyword: "flying" },
      grantPt: [2, 0],
      text: "Creatures with flying get +2/+0.",
    },
    {
      affects: { scope: "all-creatures", withoutKeyword: "flying" },
      grantPt: [-2, 0],
      text: "Creatures without flying get -2/-0.",
    },
  ],
});
