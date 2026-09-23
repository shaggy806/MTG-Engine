import { defineCard } from "../define.js";

export default defineCard({
  name: "Despark",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  types: ["instant"],
  text: "Exile target permanent with mana value 4 or greater.",
  // {X} in a permanent's mana cost counts as 0 (the 2019-05-03 ruling),
  // which is how `manaValue` reads it. (Engine-wide, not specific to this
  // card: a transformed DFC's mana value is read off its back face, so it
  // comes out 0 rather than its front face's value — rule 712.8e.)
  targets: [{ kind: "permanent", filter: { manaValue: { op: "gte", n: 4 } } }],
  effect: { kind: "exile", target: 0 },
});
