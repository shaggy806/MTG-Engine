import { defineCard } from "../define.js";

// #37 in top-commanders.txt.
//
// - Evoke is granted to the spell as it's cast from the hand
//   (`grantsEvokeToSpells`), and the permanent it becomes keeps evoke's
//   sacrifice trigger even if Ashling has left by then (the ruling).
// - The token copies the sacrificed Elemental as it last existed (rule
//   608.2h) — copiable values only, so no counters or pumps (the ruling).
// - "Sacrifice it unless you pay" names the token this resolution made
//   (`about: "created"`); a token already gone by then is nothing to keep.
const GRANT_TEXT =
  "Elemental permanent spells you cast from your hand gain evoke {4} as you cast them. " +
  "(If you cast a spell for its evoke cost, it's sacrificed when it enters.)";
const SAC_TEXT =
  "Whenever you sacrifice a nontoken Elemental, create a token that's a copy of it. The token gains haste " +
  "until end of turn. At the beginning of your next end step, sacrifice it unless you pay {W}{U}{B}{R}{G}.";

export default defineCard({
  name: "Ashling, the Limitless",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental", "Sorcerer"],
  power: 2,
  toughness: 3,
  text: `${GRANT_TEXT}\n${SAC_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantsEvokeToSpells: {
        cost: "{4}",
        filter: { subtype: "Elemental", notTypes: ["instant", "sorcery"] },
        fromHand: true,
      },
      text: GRANT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you", filter: { token: false, subtype: "Elemental" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token-copy", of: "trigger-object", count: 1, who: "you", gainUntilEndOfTurn: ["haste"] },
          {
            kind: "delayed-trigger",
            at: "your-next-end-step",
            about: "created",
            effect: {
              kind: "unless",
              chooser: "you",
              options: [{ pay: "{W}{U}{B}{R}{G}", text: "Pay {W}{U}{B}{R}{G}." }],
              otherwise: { kind: "sacrifice-target", target: 0 },
            },
            text: "At the beginning of your next end step, sacrifice it unless you pay {W}{U}{B}{R}{G}.",
          },
        ],
      },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
