import { defineCard } from "../define.js";

const TRIGGER_TEXT =
  "Whenever you cast a noncreature spell, Birds, Frogs, Otters, and Rats you control get +1/+1 until end of turn. Untap them.";

// "Birds, Frogs, Otters, and Rats you control" are permanents with any of
// those types — a Kindred one too — fixed as the ability resolves (rule
// 611.2c), and "them" is the same set.
const THEM = { subtypes: ["Bird", "Frog", "Otter", "Rat"], controlledBy: "you" } as const;

export default defineCard({
  name: "Valley Floodcaller",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Otter", "Wizard"],
  power: 2,
  toughness: 2,
  keywords: ["flash"],
  text: `Flash\nYou may cast noncreature spells as though they had flash.\n${TRIGGER_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      castAsThoughFlash: { notTypes: ["creature"] },
      text: "You may cast noncreature spells as though they had flash.",
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt-all", filter: THEM, power: 1, toughness: 1, duration: "end-of-turn" },
          { kind: "untap-all", filter: THEM },
        ],
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
