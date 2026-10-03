import { defineCard } from "../define.js";
import { hideaway, manaTapAbility, playHideawayCard } from "../helpers.js";

// Hideaway (rule 702.75): the exiled card is linked to this land (607.2a).
// "If each player has no cards in hand" is checked as the ability resolves.
const PLAY_TEXT =
  "{B}, {T}: You may play the exiled card without paying its mana cost if each player has no cards in hand.";

export default defineCard({
  name: "Howltooth Hollow",
  colors: [],
  types: ["land"],
  text:
    "Hideaway 4 (When this land enters, look at the top four cards of your library, exile one face down, then put the rest on the bottom in a random order.)\n" +
    `This land enters tapped.\n{T}: Add {B}.\n${PLAY_TEXT}`,
  activated: [
    manaTapAbility("B"),
    {
      cost: { mana: "{B}", tap: true },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "hand-size", who: "each-player", atMost: 0 },
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
