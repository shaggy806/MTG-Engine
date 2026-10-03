import { defineCard } from "../define.js";

// The rulings this follows: the trigger and its copy resolve before the
// spell, the copy made even if the spell was countered in response; a copy of
// a permanent spell becomes a token as it resolves, one that wasn't
// "created". The copy keeps the spell's {X} and the costs paid for it.
const COPY_TEXT =
  "Whenever you cast a spell of the chosen type, copy that spell. (A copy of a permanent spell becomes a token.)";

export default defineCard({
  name: "Reflections of Littjara",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: `As this enchantment enters, choose a creature type.\n${COPY_TEXT}`,
  chooseCreatureTypeOnEnter: true,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { ofChosenType: true } },
      targets: [],
      effect: { kind: "copy-spell", target: "trigger-spell" },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
