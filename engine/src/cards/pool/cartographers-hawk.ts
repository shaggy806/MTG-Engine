import { defineCard } from "../define.js";

const HAWK_TEXT =
  "When this creature deals combat damage to a player who controls more lands than you, return it to its " +
  "owner's hand. If you do, you may search your library for a Plains card, put it onto the battlefield " +
  "tapped, then shuffle.";

// "Who controls more lands than you" is part of the trigger event, counted as
// the damage is dealt — not asked again as it resolves. If the Hawk has left
// the battlefield by then it can't be returned from its new zone (the
// ruling), so there's no "if you do". "A Plains card" is any card with the
// Plains land type.
export default defineCard({
  name: "Cartographer's Hawk",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${HAWK_TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self", toPlayerControlsMore: { type: "land" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "return-to-hand", target: "source" },
          {
            kind: "conditional",
            condition: { kind: "this-way", what: "returned-to-hand" },
            then: {
              kind: "may",
              prompt: "Search your library for a Plains card?",
              effect: {
                kind: "search-library",
                filter: { subtype: "Plains" },
                destination: "battlefield",
                enterTapped: true,
                min: 0,
                max: 1,
              },
            },
          },
        ],
      },
      resolve: null,
      text: HAWK_TEXT,
    },
  ],
});
