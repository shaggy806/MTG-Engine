import { defineCard } from "../define.js";

// Top-commanders rank 133. Prince of Chaos counts Demons as it resolves, and
// Be'lakor is one, so it's at least 1; the count is read once for the draw
// and again for the life, with nothing between that could change it. Lord of
// Torment's "it" is the entering Demon, so the damage is *its* — its lifelink,
// deathtouch and colour for protection — and "its power" is read as it
// resolves, or as the Demon last existed on the battlefield if it has left
// (rule 608.2h).
const PRINCE_TEXT =
  "Prince of Chaos — When Be'lakor enters, you draw X cards and you lose X life, where X is " +
  "the number of Demons you control.";
const LORD_TEXT =
  "Lord of Torment — Whenever another Demon you control enters, it deals damage equal to its " +
  "power to any target.";

const DEMONS = { countOf: { subtype: "Demon", controlledBy: "you" } } as const;

export default defineCard({
  name: "Be'lakor, the Dark Master",
  manaCost: "{3}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Demon", "Noble"],
  power: 6,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${PRINCE_TEXT}\n${LORD_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: DEMONS },
          { kind: "lose-life", amount: DEMONS },
        ],
      },
      resolve: null,
      text: PRINCE_TEXT,
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Demon" },
        otherOnly: true,
      },
      targets: ["any-target"],
      effect: {
        kind: "damage",
        amount: { powerOf: "trigger-object" },
        target: 0,
        from: "trigger-object",
      },
      resolve: null,
      text: LORD_TEXT,
    },
  ],
});
