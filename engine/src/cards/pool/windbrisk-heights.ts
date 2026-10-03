import { defineCard } from "../define.js";
import { hideaway, manaTapAbility, playHideawayCard } from "../helpers.js";

// Hideaway (rule 702.75): the exiled card is linked to this land (607.2a).
// "If you attacked with three or more creatures this turn" is checked as the
// ability resolves: three different creatures declared as attackers over
// the turn — one declared in two combats counts once, one put onto the
// battlefield attacking never (the ruling; the `attackers` turn stat).
const PLAY_TEXT =
  "{W}, {T}: You may play the exiled card without paying its mana cost if you attacked with three or more creatures this turn.";

export default defineCard({
  name: "Windbrisk Heights",
  colors: [],
  types: ["land"],
  text:
    "Hideaway 4 (When this land enters, look at the top four cards of your library, exile one face down, then put the rest on the bottom in a random order.)\n" +
    `This land enters tapped.\n{T}: Add {W}.\n${PLAY_TEXT}`,
  activated: [
    manaTapAbility("W"),
    {
      cost: { mana: "{W}", tap: true },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "turn-stat", stat: "attackers", who: "you", atLeast: 3 },
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
