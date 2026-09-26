import { defineCard } from "../define.js";

// #354 in top-commanders.txt.
//
// The copy's exceptions are part of its copiable values (rule 707.9b): its
// name is Mishra's Warform — so a copy of a legendary artifact doesn't share
// the original's name for the legend rule — and it's a 4/4 Construct artifact
// creature besides its other types. The haste isn't an exception: it gains it
// until end of turn.
const TEXT =
  "At the beginning of combat on your turn, create a token that's a copy of target noncreature artifact you " +
  "control, except its name is Mishra's Warform and it's a 4/4 Construct artifact creature in addition to its " +
  "other types. It gains haste until end of turn. Sacrifice it at the beginning of the next end step.";

export default defineCard({
  name: "Mishra, Eminent One",
  manaCost: "{2}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 5,
  toughness: 4,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [{ kind: "permanent", whose: "you", filter: { type: "artifact", notTypes: ["creature"] } }],
      effect: {
        kind: "create-token-copy",
        of: 0,
        count: 1,
        who: "you",
        sacrificeAtEndStep: true,
        gainUntilEndOfTurn: ["haste"],
        exceptions: {
          name: "Mishra's Warform",
          basePt: [4, 4],
          addTypes: ["artifact", "creature"],
          addSubtypes: ["Construct"],
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
