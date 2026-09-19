import { defineCard } from "../define.js";

/** Morbid is an ability word, not a mechanic — it just names the
 * `creature-died-this-turn` condition the engine already had. */
export default defineCard({
  name: "Tragic Slip",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text:
    "Target creature gets -1/-1 until end of turn.\n" +
    "Morbid — That creature gets -13/-13 until end of turn instead if a creature died this turn.",
  targets: ["creature"],
  effect: {
    kind: "conditional",
    condition: { kind: "creature-died-this-turn" },
    then: { kind: "modify-pt", target: 0, power: -13, toughness: -13, duration: "end-of-turn" },
    else: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
  },
});
