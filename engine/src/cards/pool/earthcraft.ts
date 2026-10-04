import { defineCard } from "../define.js";

// EDHREC rank 4100.
// The cost taps a creature without {T}, so a summoning-sick one may pay it
// (rule 302.6 limits only {T}/{Q} costs). Earthcraft itself counts if it's
// somehow a creature, hence `includeSelf`.

export default defineCard({
  name: "Earthcraft",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "Tap an untapped creature you control: Untap target basic land.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { type: "creature", controlledBy: "you" }, includeSelf: true },
      },
      targets: [{ kind: "permanent", filter: { type: "land", supertype: "basic" } }],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "Tap an untapped creature you control: Untap target basic land.",
    },
  ],
});
