import { defineCard } from "../define.js";

// - The ETB count is read as the trigger resolves ("for each land you
//   control"), so a land that arrives in response is counted.
// - Landfall's "you may" is one yes/no for the whole clause, and "each Plant
//   creature you control" is read then too: Plants made after the trigger
//   went on the stack still get a counter, and a Plant that stopped being a
//   creature doesn't. A token stack takes the counter as a whole — every
//   Plant in it gets one.
const ETB_TEXT =
  "When this creature enters, create a 0/1 green Plant creature token for each land you control.";
const LANDFALL_TEXT =
  "Landfall — Whenever a land you control enters, you may put a +1/+1 counter on each Plant " +
  "creature you control.";

export default defineCard({
  name: "Avenger of Zendikar",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 5,
  toughness: 5,
  text: ETB_TEXT + "\n" + LANDFALL_TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Plant Token",
        count: { countOf: { type: "land", controlledBy: "you" } },
      },
      resolve: null,
      text: ETB_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Put a +1/+1 counter on each Plant creature you control?",
        effect: {
          kind: "add-counter-all",
          filter: { type: "creature", subtype: "Plant", controlledBy: "you" },
          counter: "+1/+1",
          amount: 1,
        },
      },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
});
