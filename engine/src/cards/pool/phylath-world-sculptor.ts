import { defineCard } from "../define.js";

// EDHREC rank 5232.
// Makes Plant → use "Plant Token".
//
// Rulings:
//   [2024-11-08] Whenever a land you control enters, each landfall ability of the permanents you
//     control will trigger. You can put them   on the stack in any order. The last ability you put
//     on the stack will be the first one to resolve (As a result, you can have those abilities
//     resolve in the order of your choosing.).
//   [2024-11-08] A landfall ability doesn't trigger if a permanent already on the battlefield
//     becomes a land.
//   [2024-11-08] A landfall ability triggers whenever a land you control enters for any reason. It
//     triggers whenever you play a land, as well as whenever a spell or ability puts a land onto
//     the battlefield under your control.

const ENTER_TEXT = "When Phylath enters, create a 0/1 green Plant creature token for each basic land you control.";
const LANDFALL_TEXT = "Landfall — Whenever a land you control enters, put four +1/+1 counters on target Plant you control.";

export default defineCard({
  name: "Phylath, World Sculptor",
  manaCost: "{4}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 5,
  toughness: 5,
  text: `${ENTER_TEXT}\n${LANDFALL_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Plant Token",
        count: { countOf: { supertype: "basic", type: "land", controlledBy: "you" } },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [{ kind: "permanent", whose: "you", filter: { subtype: "Plant" } }],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 4 },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
});
