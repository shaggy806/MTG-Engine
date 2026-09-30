import { defineCard } from "../define.js";

export default defineCard({
  name: "Darkness",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Prevent all combat damage that would be dealt this turn.",
  effect: { kind: "prevent-all-combat-damage" },
});
