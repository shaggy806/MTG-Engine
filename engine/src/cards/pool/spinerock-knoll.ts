import { defineCard } from "../define.js";
import { hideaway, manaTapAbility, playHideawayCard } from "../helpers.js";

// Hideaway (rule 702.75): the exiled card is linked to this land (607.2a).
// "If an opponent was dealt 7 or more damage this turn" is checked as the
// ability resolves: some one opponent's total, from any sources, whether or
// not this land was around for it (the rulings).
const PLAY_TEXT =
  "{R}, {T}: You may play the exiled card without paying its mana cost if an opponent was dealt 7 or more damage this turn.";

export default defineCard({
  name: "Spinerock Knoll",
  colors: [],
  types: ["land"],
  text:
    "Hideaway 4 (When this land enters, look at the top four cards of your library, exile one face down, then put the rest on the bottom in a random order.)\n" +
    `This land enters tapped.\n{T}: Add {R}.\n${PLAY_TEXT}`,
  activated: [
    manaTapAbility("R"),
    {
      cost: { mana: "{R}", tap: true },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "turn-stat", stat: "damage-taken", who: "opponent", atLeast: 7 },
        then: playHideawayCard(),
      },
      resolve: null,
      text: PLAY_TEXT,
    },
  ],
  triggered: [hideaway(4, "land")],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
