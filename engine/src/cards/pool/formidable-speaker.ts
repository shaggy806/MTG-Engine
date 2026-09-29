import { defineCard } from "../define.js";

const ENTER_TEXT =
  "When this creature enters, you may discard a card. If you do, search your library for a " +
  "creature card, reveal it, put it into your hand, then shuffle.";
const UNTAP_TEXT = "{1}, {T}: Untap another target permanent.";

// "If you do" is asked of what the discard actually did (`this-way`), so
// saying yes with an empty hand searches for nothing.
export default defineCard({
  name: "Formidable Speaker",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 2,
  toughness: 4,
  text: `${ENTER_TEXT}\n${UNTAP_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Discard a card to search your library for a creature card?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "discard", target: "you", amount: 1 },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "discarded" },
              then: {
                kind: "search-library",
                filter: { type: "creature" },
                destination: "hand",
                min: 0,
                max: 1,
                reveal: true,
              },
            },
          ],
        },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [{ kind: "other", of: { kind: "permanent", filter: {} } }],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: UNTAP_TEXT,
    },
  ],
});
