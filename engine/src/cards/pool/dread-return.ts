import { defineCard } from "../define.js";

// "Flashback—Sacrifice three creatures" is a flashback cost with no mana in
// it: the three are chosen as the cost is paid, after the target is chosen —
// so none of them can be the creature it brings back (the 2022 ruling).
export default defineCard({
  name: "Dread Return",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Return target creature card from your graveyard to the battlefield.\n" +
    "Flashback—Sacrifice three creatures. (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
  effect: { kind: "put-onto-battlefield", target: 0 },
  flashback: { cost: "", sacrifice: { filter: { type: "creature" }, count: 3 } },
});
