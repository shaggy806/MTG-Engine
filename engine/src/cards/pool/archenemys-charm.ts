import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";

// EDHREC rank 3246.
//
// "One or two target … cards": one required slot and an optional second that
// must be a different card (rule 601.2c), returned together.

const EXILE_MODE = "Exile target creature or planeswalker.";
const RETURN_MODE = "Return one or two target creature and/or planeswalker cards from your graveyard to your hand.";
const COUNTERS_MODE = "Put two +1/+1 counters on target creature you control. It gains lifelink until end of turn.";

const card: TargetSpec = {
  kind: "card-in-graveyard",
  whose: "you",
  filter: { typesAnyOf: ["creature", "planeswalker"] },
};

export default defineCard({
  name: "Archenemy's Charm",
  manaCost: "{B}{B}{B}",
  colors: ["B"],
  types: ["instant"],
  text: `Choose one —\n• ${EXILE_MODE}\n• ${RETURN_MODE}\n• ${COUNTERS_MODE}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: EXILE_MODE,
        targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
        effect: { kind: "exile", target: 0 },
      },
      {
        text: RETURN_MODE,
        targets: [card, { kind: "optional", of: { kind: "other", of: card, than: { slot: 0 } } }],
        effect: {
          kind: "sequence",
          simultaneous: true,
          effects: [
            { kind: "return-to-hand", target: 0, from: "graveyard" },
            { kind: "return-to-hand", target: 1, from: "graveyard" },
          ],
        },
      },
      {
        text: COUNTERS_MODE,
        targets: ["creature-you-control"],
        effect: {
          kind: "sequence",
          effects: [
            { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
            { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" },
          ],
        },
      },
    ],
  },
});
