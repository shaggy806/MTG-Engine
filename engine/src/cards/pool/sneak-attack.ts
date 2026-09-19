import { defineCard } from "../define.js";

/**
 * Three pieces that only became expressible together: putting a card from
 * hand onto the battlefield, a `then` that can name the card *chosen* that
 * way (it was never a target of anything), and a delayed triggered ability to
 * take it away again at end of turn.
 */
export default defineCard({
  name: "Sneak Attack",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text:
    "{R}: You may put a creature card from your hand onto the battlefield. " +
    "That creature gains haste. Sacrifice the creature at the beginning of the next end step.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "creature" },
        then: {
          kind: "sequence",
          effects: [
            { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
            {
              kind: "delayed-trigger",
              at: "next-end-step",
              effect: { kind: "sacrifice-target", target: 0 },
              text: "Sacrifice the creature Sneak Attack put onto the battlefield.",
            },
          ],
        },
      },
      resolve: null,
      text:
        "{R}: You may put a creature card from your hand onto the battlefield. " +
        "That creature gains haste. Sacrifice the creature at the beginning of the next end step.",
    },
  ],
});
