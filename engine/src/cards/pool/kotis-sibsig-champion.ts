import { defineCard } from "../define.js";

const CAST_TEXT =
  "Once during each of your turns, you may cast a creature spell from your graveyard by exiling three other cards from your graveyard in addition to paying its other costs.";
const COUNTERS_TEXT =
  "Whenever one or more creatures you control enter, if one or more of them entered from a graveyard or was cast from a graveyard, put two +1/+1 counters on Kotis.";

// A creature cast this way wasn't escaped: its own "unless it escaped" still
// applies (`castVia` is `"graveyard-permission"`). The trigger is batched —
// once per simultaneous entry, whatever else entered with them — and a
// permanent spell cast from a graveyard enters from the stack, so it's the
// cast that counts for it (`castFrom`).
export default defineCard({
  name: "Kotis, Sibsig Champion",
  manaCost: "{B}{G}{U}",
  colors: ["B", "G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Warrior"],
  power: 3,
  toughness: 3,
  text: `${CAST_TEXT}\n${COUNTERS_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      castFromGraveyard: { filter: { type: "creature" }, oncePerTurn: true, yourTurnOnly: true, exileOthers: 3 },
      text: CAST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        batched: true,
        filter: { type: "creature", anyOf: [{ enteredFrom: "graveyard" }, { castFrom: "graveyard" }] },
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 },
      resolve: null,
      text: COUNTERS_TEXT,
    },
  ],
});
