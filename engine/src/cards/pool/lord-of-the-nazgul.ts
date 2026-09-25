import { defineCard } from "../define.js";

// "Wraiths you control have protection from Ring-bearers" has no field
// because it can never apply here: a Ring-bearer is chosen only when the
// Ring tempts you (rule 701.52), and nothing the engine runs does that, so
// no creature is ever a Ring-bearer to be protected from.
export default defineCard({
  name: "Lord of the Nazgûl",
  manaCost: "{3}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Wraith", "Noble"],
  power: 4,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWraiths you control have protection from Ring-bearers.\nWhenever you cast an instant or sorcery spell, create a 3/3 black Wraith creature token with menace. Then if you control nine or more Wraiths, Wraiths you control have base power and toughness 9/9 until end of turn.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Wraith Token", count: 1 },
          {
            kind: "conditional",
            condition: { kind: "controls", filter: { subtype: "Wraith" }, atLeast: 9 },
            then: {
              kind: "animate-all",
              filter: { subtype: "Wraith", controlledBy: "you" },
              power: 9,
              toughness: 9,
              duration: "end-of-turn",
            },
          },
        ],
      },
      resolve: null,
      text: "Whenever you cast an instant or sorcery spell, create a 3/3 black Wraith creature token with menace. Then if you control nine or more Wraiths, Wraiths you control have base power and toughness 9/9 until end of turn.",
    },
  ],
});
