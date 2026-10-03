import { defineCard } from "../define.js";

const MANA_TEXT =
  "{T}: Add two mana in any combination of colors. Spend this mana only to cast creature spells or activate abilities of creature sources.";
const CAST_TEXT =
  "Whenever you cast a creature spell with power 5 or greater, put a +1/+1 counter on Gwenna and untap it.";

// "Creature sources" (rule 109.2a): a creature card's ability counts, in any
// zone (`abilityOfAnyZone`, as Secluded Courtyard's). Tapped by hand, each
// split of the two units is its own activation; the auto-payer picks the one
// the cost wants.
export default defineCard({
  name: "Gwenna, Eyes of Gaea",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Druid", "Scout"],
  power: 2,
  toughness: 3,
  text: `${MANA_TEXT}\n${CAST_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { oneOf: ["W", "U", "B", "R", "G"] },
        amount: 2,
        spendOnly: {
          spell: { type: "creature" },
          abilityOf: { type: "creature" },
          abilityOfAnyZone: true,
          text: "Spend this mana only to cast creature spells or activate abilities of creature sources.",
        },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature", power: { op: "gte", n: 5 } } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          { kind: "untap", target: "source" },
        ],
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
