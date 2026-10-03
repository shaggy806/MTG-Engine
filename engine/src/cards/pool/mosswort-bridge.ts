import { defineCard } from "../define.js";
import { hideaway, manaTapAbility, playHideawayCard } from "../helpers.js";

// Hideaway (rule 702.75): the exiled card is linked to this land (607.2a).
// "If creatures you control have total power 10 or greater" is checked as
// the ability resolves, not as it's activated.
const PLAY_TEXT =
  "{G}, {T}: You may play the exiled card without paying its mana cost if creatures you control have total power 10 or greater.";

export default defineCard({
  name: "Mosswort Bridge",
  colors: [],
  types: ["land"],
  text:
    "Hideaway 4 (When this land enters, look at the top four cards of your library, exile one face down, then put the rest on the bottom in a random order.)\n" +
    `This land enters tapped.\n{T}: Add {G}.\n${PLAY_TEXT}`,
  activated: [
    manaTapAbility("G"),
    {
      cost: { mana: "{G}", tap: true },
      targets: [],
      effect: {
        kind: "conditional",
        condition: {
          kind: "aggregate",
          value: { aggregate: "sum", of: "power", filter: { type: "creature", controlledBy: "you" } },
          compare: { op: "gte", n: 10 },
        },
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
