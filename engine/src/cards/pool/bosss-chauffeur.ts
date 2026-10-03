import { defineCard } from "../define.js";

// The entering count is read as it enters (rule 614.12), so creatures
// entering alongside it aren't "other creatures you control" yet. The dies
// trigger counts the +1/+1 counters it died with (rule 608.2h).
const ENTER_TEXT =
  "This creature enters with a number of +1/+1 counters on it equal to one plus the number of other creatures you control.";
const ALLIANCE_TEXT = "Alliance — Whenever another creature you control enters, put a +1/+1 counter on this creature.";
const DIES_TEXT =
  "When this creature dies, create a 1/1 green and white Citizen creature token for each +1/+1 counter on it.";

export default defineCard({
  name: "Boss's Chauffeur",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Elf", "Citizen"],
  power: 0,
  toughness: 0,
  text: `${ENTER_TEXT}\n${ALLIANCE_TEXT}\n${DIES_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        counters: {
          kind: "+1/+1",
          amount: { sum: [1, { countOf: { type: "creature", controlledBy: "you" }, excludeSelf: true }] },
        },
      },
      text: ENTER_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: ALLIANCE_TEXT,
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Citizen Token", count: { countersOn: "source", counter: "+1/+1" } },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
