import { defineCard } from "../define.js";

const TOKENS_MODE =
  "Create a number of 1/1 red Warrior creature tokens equal to the number of creatures target player controls.";
const DAMAGE_MODE = "Will of the Mardu deals damage to target creature equal to the number of creatures you control.";

// "Choose both" while you control a commander — anyone's (the ruling) — is
// `maxModesIf`, asked once as the modes are chosen. Both modes resolve in
// printed order, so the Warriors are among "the creatures you control" the
// damage counts. "Target player" may be you.
export default defineCard({
  name: "Will of the Mardu",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Choose one. If you control a commander as you cast this spell, you may choose both instead.\n" +
    `• ${TOKENS_MODE}\n• ${DAMAGE_MODE}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    maxModesIf: { condition: { kind: "controls", filter: { isCommander: true }, atLeast: 1 }, maxModes: 2 },
    modes: [
      {
        text: TOKENS_MODE,
        targets: ["player"],
        effect: {
          kind: "create-token",
          token: "Red Warrior Token",
          count: { countOf: { type: "creature", controlledBy: "you" }, forTarget: 0 },
        },
      },
      {
        text: DAMAGE_MODE,
        targets: ["creature"],
        effect: {
          kind: "damage",
          target: 0,
          amount: { countOf: { type: "creature", controlledBy: "you" } },
        },
      },
    ],
  },
});
