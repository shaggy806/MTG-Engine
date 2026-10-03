import { defineCard } from "../define.js";

// Transforms into Itlimoc, Cradle of the Sun. Only the creature taken is
// revealed; the rest go on the bottom in an order its controller picks
// (`"bottom-any-order"`). The end-step clause is an intervening-if (rule
// 603.4): it doesn't trigger without four creatures as the step begins, and
// does nothing if they're gone as it resolves (its ruling).
const ENTER_TEXT =
  "When Growing Rites of Itlimoc enters, look at the top four cards of your library. You may reveal a creature card from among them and put it into your hand. Put the rest on the bottom of your library in any order.";
const TRANSFORM_TEXT =
  "At the beginning of your end step, if you control four or more creatures, transform Growing Rites of Itlimoc.";

export default defineCard({
  name: "Growing Rites of Itlimoc",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  text: `${ENTER_TEXT}\n${TRANSFORM_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 4,
        reveal: "chosen",
        min: 0,
        max: 1,
        filter: { type: "creature" },
        destination: "hand",
        leftover: "bottom-any-order",
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "controls", filter: { type: "creature" }, atLeast: 4 },
      targets: [],
      effect: { kind: "transform", target: "source" },
      resolve: null,
      text: TRANSFORM_TEXT,
    },
  ],
  faces: ["Growing Rites of Itlimoc", "Itlimoc, Cradle of the Sun"],
  transform: true,
});
