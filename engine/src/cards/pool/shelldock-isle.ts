import { defineCard } from "../define.js";
import { hideaway, manaTapAbility, playHideawayCard } from "../helpers.js";

// Hideaway (rule 702.75): the exiled card is linked to this land (607.2a).
// "If a library has twenty or fewer cards in it" — any one library, no
// library specified (the ruling) — is checked as the ability resolves.
const PLAY_TEXT =
  "{U}, {T}: You may play the exiled card without paying its mana cost if a library has twenty or fewer cards in it.";

export default defineCard({
  name: "Shelldock Isle",
  colors: [],
  types: ["land"],
  text:
    "Hideaway 4 (When this land enters, look at the top four cards of your library, exile one face down, then put the rest on the bottom in a random order.)\n" +
    `This land enters tapped.\n{T}: Add {U}.\n${PLAY_TEXT}`,
  activated: [
    manaTapAbility("U"),
    {
      cost: { mana: "{U}", tap: true },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "library-size", who: "any-player", atMost: 20 },
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
