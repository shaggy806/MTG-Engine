import { defineCard } from "../define.js";

export default defineCard({
  name: "Fog",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Prevent all combat damage that would be dealt this turn.",
  effect: { kind: "prevent-all-combat-damage" },
});
