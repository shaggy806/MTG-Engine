import { defineCard } from "../define.js";

// EDHREC rank 5742.
//
// Rulings:
//   [2025-07-25] A landfall ability doesn't trigger if a permanent already on the battlefield
//     becomes a land.
//   [2025-07-25] A landfall ability triggers whenever a land you control enters for any reason. It
//     triggers whenever you play a land, as well as whenever a spell or ability puts a land onto
//     the battlefield under your control.
//
// The return is Whitemane Lion's untargeted `choose-permanents`, chosen as it
// resolves — `min: 0` for "you may", `exceptSource` for "another".

const ETB_TEXT = "When Ambrosia Whiteheart enters, you may return another permanent you control to its owner's hand.";
const LANDFALL_TEXT = "Landfall — Whenever a land you control enters, Ambrosia Whiteheart gets +1/+0 until end of turn.";

export default defineCard({
  name: "Ambrosia Whiteheart",
  manaCost: "{1}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 2,
  keywords: ["flash"],
  text: `Flash\n${ETB_TEXT}\n${LANDFALL_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "choose-permanents",
        filter: { controlledBy: "you" },
        min: 0,
        upTo: 1,
        exceptSource: true,
        then: { kind: "return-to-hand", target: 0 },
        prompt: "Return another permanent you control to its owner's hand?",
      },
      resolve: null,
      text: ETB_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
});
