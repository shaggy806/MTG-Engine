import { defineCard } from "../define.js";

const DOUBLE_TEXT =
  "If one or more tokens would be created under your control, twice that many of those tokens are created instead.";
const COUNTER_TEXT =
  "{1}{W/P}{W/P}, Sacrifice two other artifacts and/or creatures: Put an indestructible counter on Mondrak. ({W/P} can be paid with either {W} or 2 life.)";

// Anointed Procession's replacement: the extra tokens are made by the same
// effect, so whatever it says of them (tapped and attacking, counters) holds
// for them too (the ruling). The two other artifacts and/or creatures are
// chosen as the cost is paid; `otherOnly` keeps Mondrak out of it.
export default defineCard({
  name: "Mondrak, Glory Dominus",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Horror"],
  power: 4,
  toughness: 4,
  text: `${DOUBLE_TEXT}\n${COUNTER_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-create-token", multiplier: 2 },
      text: DOUBLE_TEXT,
    },
  ],
  activated: [
    {
      cost: {
        mana: "{1}{W/P}{W/P}",
        tap: false,
        sacrifice: { filter: { typesAnyOf: ["artifact", "creature"] }, count: 2 },
      },
      otherOnly: true,
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "indestructible", amount: 1 },
      resolve: null,
      text: COUNTER_TEXT,
    },
  ],
});
