import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const STATIC_TEXT = "During your turn, equipped creature has hexproof and can't be blocked.";
const ALONE_TEXT = "Whenever equipped creature attacks alone, you draw a card and you lose 1 life.";
const HALFLING_TEXT = "Equip Halfling {1}";

// "Attacks alone" is the only creature declared as an attacker — not the
// last one left after the others are removed from combat (the ruling).
export default defineCard({
  name: "Bilbo's Ring",
  manaCost: "{3}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text:
    `${STATIC_TEXT}\n${ALONE_TEXT}\n` +
    `${HALFLING_TEXT} ({1}: Attach to target Halfling you control. Equip only as a sorcery.)\n` +
    "Equip {4} ({4}: Attach to target creature you control. Equip only as a sorcery.)",
  static: [
    {
      affects: { scope: "attached" },
      condition: { kind: "your-turn" },
      grantKeywords: ["hexproof", "unblockable"],
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks-alone", who: "attached" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1 },
        ],
      },
      resolve: null,
      text: ALONE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      targets: [{ kind: "permanent", whose: "you", filter: { type: "creature", subtype: "Halfling" } }],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: HALFLING_TEXT,
      sorcerySpeed: true,
    },
    equip("{4}"),
  ],
});
