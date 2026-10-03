import { defineCard } from "../define.js";

const MANA_TEXT =
  "{T}: Add one mana of any type that a land you control could produce. If this creature has a +1/+1 counter on it, add three mana of that type instead.";
const ADAPT_TEXT =
  "{3}{G}{G}: Adapt 3. (If this creature has no +1/+1 counters on it, put three +1/+1 counters on it.)";

// "Three mana of that type": all three one type (`same`), read off the lands
// as rule 106.7 does (costs and legality ignored — the ruling), with none of
// their restrictions or riders.
export default defineCard({
  name: "Incubation Druid",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 0,
  toughness: 2,
  text: `${MANA_TEXT}\n${ADAPT_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { producedBy: "your-lands", anyType: true, same: true },
        amount: {
          ifCondition: { kind: "self-counters", counter: "+1/+1", compare: { op: "gte", n: 1 } },
          then: 3,
          else: 1,
        },
      },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      cost: { mana: "{3}{G}{G}", tap: false },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "source", filter: { counters: { kind: "+1/+1", compare: { op: "eq", n: 0 } } } },
        then: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 3 },
      },
      resolve: null,
      text: ADAPT_TEXT,
    },
  ],
});
