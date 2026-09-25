import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// #47 in top-commanders.txt.
//
// - "Other creatures" is every other creature on the battlefield, opponents'
//   included: they're Food artifacts (layer 4) and have the Food ability.
// - "Whenever a Food is put into a graveyard from the battlefield" is a `dies`
//   trigger over any Food — a creature made a Food by Ygra dying counts, read
//   as it last existed on the battlefield.
const FOOD_ABILITY = "{2}, {T}, Sacrifice this permanent: You gain 3 life.";
const STATIC_TEXT = `Other creatures are Food artifacts in addition to their other types and have "${FOOD_ABILITY}"`;
const TRIGGER_TEXT = "Whenever a Food is put into a graveyard from the battlefield, put two +1/+1 counters on Ygra.";
const WARD = ward({ sacrifice: { filter: { subtype: "Food" }, text: "Sacrifice a Food" } });

export default defineCard({
  name: "Ygra, Eater of All",
  manaCost: "{3}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental", "Cat"],
  power: 6,
  toughness: 6,
  text: `${WARD.text}\n${STATIC_TEXT}\n${TRIGGER_TEXT}`,
  static: [
    {
      affects: { scope: "all-creatures", excludeSelf: true },
      addTypes: ["artifact"],
      addSubtypes: ["Food"],
      grantsActivated: [
        {
          cost: { mana: "{2}", tap: true, sacrifice: "self" },
          targets: [],
          effect: { kind: "gain-life", amount: 3 },
          resolve: null,
          text: FOOD_ABILITY,
        },
      ],
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    WARD,
    {
      trigger: { on: "dies", who: "any", filter: { subtype: "Food" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
