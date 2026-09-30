import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const ENTER_TEXT = "This land enters with a charge counter on it.";
const CHARGE_TEXT = "{X}{X}, {T}: Put X charge counters on this land.";
const BLAST_TEXT =
  "{3}, {T}, Sacrifice this land: Destroy each nonland permanent with mana value equal to the number of charge counters on this land.";

// The count is the land's as it was sacrificed (last-known information,
// rule 608.2h).
export default defineCard({
  name: "Blast Zone",
  types: ["land"],
  text: `${ENTER_TEXT}\n{T}: Add {C}.\n${CHARGE_TEXT}\n${BLAST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "charge", amount: 1 } },
      text: ENTER_TEXT,
    },
  ],
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{X}{X}", tap: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "charge", amount: "x" },
      resolve: null,
      text: CHARGE_TEXT,
    },
    {
      cost: { mana: "{3}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "destroy-all",
        filter: {
          notTypes: ["land"],
          manaValue: { op: "eq", n: { amount: { countersOn: "source", counter: "charge" } } },
        },
      },
      resolve: null,
      text: BLAST_TEXT,
    },
  ],
});
