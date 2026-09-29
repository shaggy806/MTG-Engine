import { defineCard } from "../define.js";

const GRANTED_TEXT =
  "Whenever this creature becomes tapped, it deals damage equal to its power to up to one target creature.";

export default defineCard({
  name: "Legolas's Quick Reflexes",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  splitSecond: true,
  text:
    "Split second (As long as this spell is on the stack, players can't cast spells or activate " +
    "abilities that aren't mana abilities.)\n" +
    `Untap target creature. Until end of turn, it gains reach, hexproof, and "${GRANTED_TEXT}"`,
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "untap", target: 0 },
      { kind: "grant-keyword", target: 0, keyword: "reach", duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "hexproof", duration: "end-of-turn" },
      {
        kind: "grant-triggered",
        target: 0,
        duration: "end-of-turn",
        ability: {
          trigger: { on: "becomes-tapped", who: "self" },
          targets: [{ kind: "optional", of: "creature" }],
          effect: { kind: "damage", target: 0, amount: { powerOf: "source" } },
          resolve: null,
          text: GRANTED_TEXT,
        },
      },
    ],
  },
});
