import { defineCard } from "../define.js";

const ATTACK_TEXT = "Whenever you attack, you may sacrifice another creature. When you do, choose two —";
const TOKENS_MODE = "Create two 1/1 red and white Soldier creature tokens with haste that are tapped and attacking.";
const DRAW_MODE = "You draw a card and you lose 1 life.";
const DAMAGE_MODE = "Caesar deals damage equal to the number of creature tokens you control to target opponent.";

// "When you do" is a reflexive ability (rule 603.12) put on the stack once
// the sacrifice is made; its two modes, and the third mode's target, are
// chosen then (rules 603.3c, 700.2b). The damage counts the creature tokens
// you control as it resolves — the Soldiers too, when both modes are chosen.
// Where each Soldier attacks is its controller's choice (rule 508.4).
export default defineCard({
  name: "Caesar, Legion's Emperor",
  manaCost: "{1}{R}{W}{B}",
  colors: ["R", "W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 4,
  toughness: 4,
  text: `${ATTACK_TEXT}\n• ${TOKENS_MODE}\n• ${DRAW_MODE}\n• ${DAMAGE_MODE}`,
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      targets: [],
      effect: {
        kind: "each-player-may",
        who: "you",
        options: [{ sacrifice: { type: "creature" }, exceptSource: true, text: "Sacrifice another creature" }],
        ifDid: {
          kind: "reflexive-trigger",
          targets: [],
          effect: {
            kind: "modal",
            announced: true,
            minModes: 2,
            maxModes: 2,
            modes: [
              {
                text: TOKENS_MODE,
                effect: { kind: "create-token", token: "Red-White Soldier Token", count: 2, tapped: true, attacking: "choose" },
              },
              {
                text: DRAW_MODE,
                effect: {
                  kind: "sequence",
                  effects: [
                    { kind: "draw", amount: 1 },
                    { kind: "lose-life", amount: 1 },
                  ],
                },
              },
              {
                text: DAMAGE_MODE,
                targets: ["opponent"],
                effect: {
                  kind: "damage",
                  target: 0,
                  amount: { countOf: { type: "creature", token: true, controlledBy: "you" } },
                },
              },
            ],
          },
          text: `When you do, choose two — • ${TOKENS_MODE} • ${DRAW_MODE} • ${DAMAGE_MODE}`,
        },
      },
      resolve: null,
      text: `${ATTACK_TEXT} ${TOKENS_MODE} ${DRAW_MODE} ${DAMAGE_MODE}`,
    },
  ],
});
