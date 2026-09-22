import { defineCard } from "../define.js";

/**
 * The Lord of the Rings: Holiday release. Both clauses are plain existing
 * vocabulary — the ETB trigger is the Ganax, Astral Hunter shape (a tribal
 * "this or another X you control enters", which needs no `otherOnly` because
 * the source is itself one of them), and the anthem is a `grantPtPerCount`
 * lord clause whose count is a live battlefield filter.
 */
export default defineCard({
  name: "Thorin, King of Durin's Folk",
  manaCost: "{3}{R}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dwarf", "Noble"],
  power: 4,
  toughness: 4,
  text:
    "Whenever Thorin or another Dwarf you control enters, create a Treasure token.\n" +
    "Other Dwarves you control get +1/+0 for each artifact token you control.",
  triggered: [
    {
      // "Thorin **or another** Dwarf" — no `otherOnly`, so Thorin's own entry
      // counts too (it is a Dwarf). `who: "you-control"` is the "you control"
      // half: a Dwarf entering under an opponent's control does nothing.
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Dwarf" },
      },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "Whenever Thorin or another Dwarf you control enters, create a Treasure token.",
    },
  ],
  static: [
    {
      // "**Other** Dwarves you control" — `excludeSelf` keeps Thorin out of
      // its own anthem. The bonus scales with a live count of *artifact
      // tokens* you control (Treasures, Food, Clues alike — not a printed
      // artifact card), read on every characteristics fold in layer 7d.
      affects: { scope: "creatures-you-control", subtype: "Dwarf", excludeSelf: true },
      grantPtPerCount: {
        filter: { type: "artifact", token: true, controlledBy: "you" },
        pt: [1, 0],
      },
      text: "Other Dwarves you control get +1/+0 for each artifact token you control.",
    },
  ],
});
