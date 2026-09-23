import type { TriggeredAbility } from "../../abilities.js";
import { defineCard } from "../define.js";

/** Prowess as a creature prints it. Granted, "source" is the creature that
 * has the copy, so each one pumps itself. */
const prowess: TriggeredAbility = {
  trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
  targets: [],
  effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
  resolve: null,
  text: "Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)",
};

export default defineCard({
  name: "Bria, Riptide Rogue",
  manaCost: "{2}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Otter", "Rogue"],
  power: 3,
  toughness: 3,
  text:
    "Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)\n" +
    "Other creatures you control have prowess. (If a creature has multiple instances of prowess, each triggers separately.)\n" +
    "Whenever you cast a noncreature spell, target creature you control can't be blocked this turn.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantsTriggered: [prowess],
      text: "Other creatures you control have prowess.",
    },
  ],
  triggered: [
    prowess,
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: ["creature-you-control"],
      effect: { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
      resolve: null,
      text: "Whenever you cast a noncreature spell, target creature you control can't be blocked this turn.",
    },
  ],
});
