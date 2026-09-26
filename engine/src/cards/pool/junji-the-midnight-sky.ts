import { defineCard } from "../define.js";

const DIES_TEXT = "When Junji dies, choose one —";
const DISCARD_MODE = "Each opponent discards two cards and loses 2 life.";
const REANIMATE_MODE =
  "Put target non-Dragon creature card from a graveyard onto the battlefield under your control. You lose 2 life.";

// A target gone by resolution means the ability does nothing — not even the
// life loss (rule 608.2b).
export default defineCard({
  name: "Junji, the Midnight Sky",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon", "Spirit"],
  power: 5,
  toughness: 5,
  keywords: ["flying", "menace"],
  text: `Flying, menace\n${DIES_TEXT}\n• ${DISCARD_MODE}\n• ${REANIMATE_MODE}`,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: DISCARD_MODE,
            effect: {
              kind: "sequence",
              effects: [
                { kind: "discard", target: "each-opponent", amount: 2 },
                { kind: "lose-life", amount: 2, who: "each-opponent" },
              ],
            },
          },
          {
            text: REANIMATE_MODE,
            targets: [{ kind: "card-in-graveyard", filter: { type: "creature", notSubtypes: ["Dragon"] } }],
            effect: {
              kind: "sequence",
              effects: [
                { kind: "put-onto-battlefield", target: 0, underYourControl: true },
                { kind: "lose-life", amount: 2 },
              ],
            },
          },
        ],
      },
      resolve: null,
      text: `${DIES_TEXT} ${DISCARD_MODE} ${REANIMATE_MODE}`,
    },
  ],
});
