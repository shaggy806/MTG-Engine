import { defineCard } from "../define.js";

// Top-commanders rank 440. The rulings this follows: any player's spell
// whose every target is the same one creature, whoever controls it; the copy
// is yours, made even if the spell was countered in response, keeps the
// original's modes, {X} and the costs paid for it (a kicked spell's copy is
// kicked), isn't cast, and resolves first; every target of it is Ivy (rule
// 707.10e), and if Ivy isn't a legal target for each, no copy is made. A copy
// of an Aura spell becomes a token attached to Ivy.
const COPY_TEXT =
  "Whenever a player casts a spell that targets only a single creature other than Ivy, you may copy that " +
  "spell. The copy targets Ivy. (A copy of an Aura spell becomes a token.)";

export default defineCard({
  name: "Ivy, Gleeful Spellthief",
  manaCost: "{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Faerie", "Rogue"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${COPY_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "any",
        filter: { targets: { only: true, single: true, permanent: { type: "creature" }, source: false } },
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Copy that spell? The copy targets Ivy.",
        effect: { kind: "copy-spell", target: "trigger-spell", retargetTo: "source" },
      },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
