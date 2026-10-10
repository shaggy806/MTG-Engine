import { defineCard } from "../define.js";
import { crew, crewText } from "../helpers.js";

// EDHREC rank 4702. Crew's own effect, aimed at another Vehicle — but not a
// crew ability, so nothing that waits on a Vehicle becoming crewed sees it.
const ANIMATE = "{1}{W}: Another target Vehicle you control becomes an artifact creature until end of turn.";

export default defineCard({
  name: "Peacewalker Colossus",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 6,
  toughness: 6,
  text: `${ANIMATE}\n${crewText(4)}`,
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: [{ kind: "other", of: { kind: "permanent", whose: "you", filter: { subtype: "Vehicle" } } }],
      effect: { kind: "add-types", target: 0, addTypes: ["artifact", "creature"], duration: "end-of-turn" },
      resolve: null,
      text: ANIMATE,
    },
    crew(4, crewText(4)),
  ],
});
