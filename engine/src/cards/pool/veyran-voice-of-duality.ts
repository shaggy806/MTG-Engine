import { defineCard } from "../define.js";

// #224 in top-commanders.txt.
const MAGECRAFT_TEXT =
  "Magecraft — Whenever you cast or copy an instant or sorcery spell, Veyran gets +1/+1 until end of turn.";
const DOUBLE_TEXT =
  "If you casting or copying an instant or sorcery spell causes a triggered ability of a permanent " +
  "you control to trigger, that ability triggers an additional time.";

export default defineCard({
  name: "Veyran, Voice of Duality",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Efreet", "Wizard"],
  power: 2,
  toughness: 2,
  text: `${MAGECRAFT_TEXT}\n${DOUBLE_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", orCopy: true, filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: MAGECRAFT_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      doubleTriggers: {
        cause: "cast-or-copy",
        filter: { typesAnyOf: ["instant", "sorcery"], controlledBy: "you" },
      },
      text: DOUBLE_TEXT,
    },
  ],
});
