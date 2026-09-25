import { defineCard } from "../define.js";

// #212 in top-commanders.txt.
//
// - Eminence: the combat trigger works from the command zone too, with its
//   "if Arahbo is in the command zone or on the battlefield" as the
//   intervening-if.
// - The attack pump reads the Cat's power as it resolves ("where X is its
//   power"), so it doubles it.
const EMINENCE_TEXT =
  "Eminence — At the beginning of combat on your turn, if Arahbo is in the command zone or on the " +
  "battlefield, another target Cat you control gets +3/+3 until end of turn.";
const ATTACK_TEXT =
  "Whenever another Cat you control attacks, you may pay {1}{G}{W}. If you do, it gains trample and " +
  "gets +X/+X until end of turn, where X is its power.";

export default defineCard({
  name: "Arahbo, Roar of the World",
  manaCost: "{3}{G}{W}",
  colors: ["G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Cat", "Avatar"],
  power: 5,
  toughness: 5,
  text: `${EMINENCE_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      fromCommandZone: true,
      condition: { kind: "source-zone", zones: ["command", "battlefield"], sameObject: true },
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [{ kind: "other", of: { kind: "permanent", whose: "you", filter: { subtype: "Cat" } } }],
      effect: { kind: "modify-pt", target: 0, power: 3, toughness: 3, duration: "end-of-turn" },
      resolve: null,
      text: EMINENCE_TEXT,
    },
    {
      trigger: { on: "attacks", who: "you-control", otherOnly: true, filter: { subtype: "Cat" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {1}{G}{W}: it gains trample and gets +X/+X, where X is its power?",
        cost: "{1}{G}{W}",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "grant-keyword", target: "trigger-object", keyword: "trample", duration: "end-of-turn" },
            {
              kind: "modify-pt",
              target: "trigger-object",
              power: { powerOf: "trigger-object" },
              toughness: { powerOf: "trigger-object" },
              duration: "end-of-turn",
            },
          ],
        },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
