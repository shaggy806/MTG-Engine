import { defineCard } from "../define.js";

// #91 in top-commanders.txt.
const STATIC_TEXT =
  "Each creature that's enchanted by an Aura you control can't attack you or planeswalkers you control.";
const DRAIN_TEXT =
  "At the beginning of your end step, each opponent loses X life and you gain X life, where X is " +
  "the number of Auras you control.";
const AURAS = { countOf: { subtype: "Aura", controlledBy: "you" } } as const;

export default defineCard({
  name: "Eriette of the Charmed Apple",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warlock"],
  power: 2,
  toughness: 4,
  text: `${STATIC_TEXT}\n${DRAIN_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", enchantedBy: "you" } },
      cantAttackController: true,
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: AURAS, who: "each-opponent" },
          { kind: "gain-life", amount: AURAS },
        ],
      },
      resolve: null,
      text: DRAIN_TEXT,
    },
  ],
});
