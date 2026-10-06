import { defineCard } from "../define.js";

// EDHREC rank 6520.
//
// The pump is read once, as the ability resolves (rule 608.2h): counters put
// on Haldir later that turn don't grow it, and the Elves it affects are the
// ones there as it resolves (rule 611.2c).

const ENTER_TEXT = "Haldir enters with X +1/+1 counters on it.";
const PUMP_TEXT =
  "{5}{G}: Until end of turn, other Elves you control gain vigilance and get +1/+1 for each +1/+1 counter on Haldir.";

const perCounter = { countersOn: "source", counter: "+1/+1" } as const;

export default defineCard({
  name: "Haldir, Lórien Lieutenant",
  manaCost: "{X}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Soldier"],
  power: 0,
  toughness: 0,
  keywords: ["vigilance"],
  text: `${ENTER_TEXT}\nVigilance\n${PUMP_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: "x" } },
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{5}{G}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "grant-keyword-all",
            filter: { subtype: "Elf", controlledBy: "you" },
            keyword: "vigilance",
            duration: "end-of-turn",
            exceptSource: true,
          },
          {
            kind: "modify-pt-all",
            filter: { subtype: "Elf", controlledBy: "you" },
            power: perCounter,
            toughness: perCounter,
            duration: "end-of-turn",
            exceptSource: true,
          },
        ],
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
