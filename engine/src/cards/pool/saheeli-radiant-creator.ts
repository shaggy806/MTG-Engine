import { defineCard } from "../define.js";

// #249 in top-commanders.txt.
//
// "When you do" is a reflexive trigger (rule 603.12), choosing its target as
// it goes on the stack once the energy is paid. The copy's exceptions — a 5/5
// artifact creature with haste besides its other types — are part of its
// copiable values (rule 707.9b).
const ENERGY_TEXT = "Whenever you cast an Artificer or artifact spell, you get {E} (an energy counter).";
const COPY_TEXT =
  "At the beginning of combat on your turn, you may pay {E}{E}{E}. When you do, create a token that's a copy of " +
  "target permanent you control, except it's a 5/5 artifact creature in addition to its other types and has haste. " +
  "Sacrifice it at the beginning of the next end step.";
const WHEN_YOU_DO =
  "When you do, create a token that's a copy of target permanent you control, except it's a 5/5 artifact creature " +
  "in addition to its other types and has haste. Sacrifice it at the beginning of the next end step.";

export default defineCard({
  name: "Saheeli, Radiant Creator",
  manaCost: "{1}{G}{U}{R}",
  colors: ["G", "U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 4,
  toughness: 4,
  text: `${ENERGY_TEXT}\n${COPY_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { anyOf: [{ subtype: "Artificer" }, { type: "artifact" }] } },
      targets: [],
      effect: { kind: "get-energy", amount: 1 },
      resolve: null,
      text: ENERGY_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {E}{E}{E} to copy a permanent you control?",
        costEnergy: 3,
        effect: {
          kind: "reflexive-trigger",
          targets: [{ kind: "permanent", whose: "you", filter: {} }],
          effect: {
            kind: "create-token-copy",
            of: 0,
            count: 1,
            who: "you",
            sacrificeAtEndStep: true,
            exceptions: { basePt: [5, 5], addTypes: ["artifact", "creature"], keywords: ["haste"] },
          },
          text: WHEN_YOU_DO,
        },
      },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
