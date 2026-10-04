import { defineCard } from "../define.js";

// The copy's haste and draw are gained, not copied: a copy of the token
// gets neither (rule 707.2), which is what `gains` models.
const COPY_TEXT =
  '{R}, {T}, Discard a card: Create a token that\'s a copy of another target creature you control. It gains haste and "When this token dies, draw a card." Sacrifice it at the beginning of the next end step. Activate only as a sorcery.';
const BLITZ_TEXT =
  'Blitz {1}{R} (If you cast this spell for its blitz cost, it gains haste and "When this creature dies, draw a card." Sacrifice it at the beginning of the next end step.)';

export default defineCard({
  name: "Jaxis, the Troublemaker",
  manaCost: "{3}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 3,
  text: `${COPY_TEXT}\n${BLITZ_TEXT}`,
  blitz: { cost: "{1}{R}" },
  activated: [
    {
      cost: { mana: "{R}", tap: true, discard: { count: 1 } },
      sorcerySpeed: true,
      targets: [{ kind: "other", of: "creature-you-control" }],
      effect: {
        kind: "create-token-copy",
        of: 0,
        count: 1,
        gains: {
          keywords: ["haste"],
          triggered: [
            {
              trigger: { on: "dies", who: "self" },
              targets: [],
              effect: { kind: "draw", amount: 1 },
              resolve: null,
              text: "When this token dies, draw a card.",
            },
          ],
        },
        sacrificeAtEndStep: true,
      },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
