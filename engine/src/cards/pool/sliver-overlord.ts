import { defineCard } from "../define.js";

export default defineCard({
  name: "Sliver Overlord",
  manaCost: "{W}{U}{B}{R}{G}",
  colors: ["W", "U", "B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Sliver", "Mutant"],
  power: 7,
  toughness: 7,
  text:
    "{3}: Search your library for a Sliver card, reveal that card, put it into your hand, then shuffle.\n" +
    "{3}: Gain control of target Sliver. (This effect lasts indefinitely.)",
  activated: [
    {
      cost: { mana: "{3}", tap: false },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Sliver" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: "{3}: Search your library for a Sliver card, reveal that card, put it into your hand, then shuffle.",
    },
    {
      cost: { mana: "{3}", tap: false },
      targets: [{ kind: "permanent", filter: { subtype: "Sliver" } }],
      // A timestamped layer-2 effect with no end: the latest control effect on
      // the Sliver wins (rule 613.7), so two Overlords trade it back and forth.
      effect: { kind: "gain-control", target: 0, untilEndOfTurn: false },
      resolve: null,
      text: "{3}: Gain control of target Sliver. (This effect lasts indefinitely.)",
    },
  ],
});
