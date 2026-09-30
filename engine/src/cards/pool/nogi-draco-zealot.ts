import { defineCard } from "../define.js";

const COST_TEXT = "Dragon spells you cast cost {1} less to cast.";
const ATTACK_TEXT =
  "Whenever Nogi attacks, if you control three or more Dragons, until end of turn, Nogi becomes a Dragon with base power and toughness 5/5 and gains flying.";

// "Becomes a Dragon" replaces its creature types (rule 205.1a) — no longer a
// Kobold Shaman. The count includes Nogi once it's a Dragon itself.
export default defineCard({
  name: "Nogi, Draco-Zealot",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Kobold", "Shaman"],
  power: 3,
  toughness: 3,
  text: `${COST_TEXT}\n${ATTACK_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { subtype: "Dragon" }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      condition: { kind: "controls", filter: { subtype: "Dragon" }, atLeast: 3 },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: 5,
        toughness: 5,
        addTypes: [],
        addSubtypes: [],
        setSubtypes: ["Dragon"],
        keywords: ["flying"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
