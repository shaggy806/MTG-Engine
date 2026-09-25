import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

const STATIC_TEXT =
  "Equipped creature has ward {2}, is an Assassin in addition to its other types, and can't be blocked.";

export default defineCard({
  name: "Brotherhood Regalia",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${STATIC_TEXT}\nEquip legendary creature {1}\nEquip {3}`,
  static: [
    {
      affects: { scope: "attached" },
      addSubtypes: ["Assassin"],
      grantKeywords: ["unblockable"],
      grantsTriggered: [ward({ mana: "{2}" })],
      text: STATIC_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      targets: [{ kind: "permanent", whose: "you", filter: { type: "creature", supertype: "legendary" } }],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      sorcerySpeed: true,
      text: "Equip legendary creature {1}",
    },
    {
      cost: { mana: "{3}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      sorcerySpeed: true,
      text: "Equip {3}",
    },
  ],
});
