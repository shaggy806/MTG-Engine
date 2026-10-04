import { defineCard } from "../define.js";

// EDHREC rank 6239.

const PUMP_TEXT = "{G}, {T}: Target legendary creature gets +1/+1 until end of turn.";

export default defineCard({
  name: "Okina, Temple to the Grandfathers",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: `{T}: Add {G}.\n${PUMP_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
    {
      cost: { mana: "{G}", tap: true },
      targets: [{ kind: "permanent", filter: { type: "creature", supertype: "legendary" } }],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
