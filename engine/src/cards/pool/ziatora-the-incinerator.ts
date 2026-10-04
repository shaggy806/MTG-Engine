import { defineCard } from "../define.js";

const TEXT =
  "At the beginning of your end step, you may sacrifice another creature. When you do, Ziatora deals damage " +
  "equal to that creature's power to any target and you create three Treasure tokens.";

// "When you do" is a reflexive ability (rule 603.12): it goes on the stack
// once the sacrifice is made and chooses its target then. The damage is the
// sacrificed creature's power as it last existed on the battlefield (the
// ruling), read as the sacrifice is made and carried as the ability's
// trigger value.
export default defineCard({
  name: "Ziatora, the Incinerator",
  manaCost: "{3}{B}{R}{G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Demon", "Dragon"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "each-player-may",
        who: "you",
        options: [{ sacrifice: { type: "creature" }, exceptSource: true, text: "Sacrifice another creature" }],
        ifDid: {
          kind: "reflexive-trigger",
          targets: ["any-target"],
          value: { powerOf: "sacrificed" },
          effect: {
            kind: "sequence",
            effects: [
              { kind: "damage", target: 0, amount: { triggerValue: true } },
              { kind: "create-token", token: "Treasure Token", count: 3 },
            ],
          },
          text: "When you do, Ziatora deals damage equal to that creature's power to any target and you create three Treasure tokens.",
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
