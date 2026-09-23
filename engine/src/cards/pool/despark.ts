import { defineCard } from "../define.js";

export default defineCard({
  name: "Despark",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  types: ["instant"],
  text: "Exile target permanent with mana value 4 or greater.",
  // {X} in a permanent's mana cost counts as 0 (the 2019-05-03 ruling),
  // which is how `manaValue` reads it off the stack. A transformed DFC has
  // its front face's mana value (rule 712.8e), so a flipped Bloodline Keeper
  // is still a legal target.
  targets: [{ kind: "permanent", filter: { manaValue: { op: "gte", n: 4 } } }],
  effect: { kind: "exile", target: 0 },
});
