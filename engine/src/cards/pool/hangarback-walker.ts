import { defineCard } from "../define.js";

const ENTER_TEXT = "This creature enters with X +1/+1 counters on it.";
const DIES_TEXT =
  "When this creature dies, create a 1/1 colorless Thopter artifact creature token with flying for each +1/+1 counter on this creature.";
const GROW_TEXT = "{1}, {T}: Put a +1/+1 counter on this creature.";

// The dies trigger counts the counters it died with (last-known
// information). -1/-1 counters that killed it don't cancel any first: rule
// 704.5q applies only to what stays on the battlefield (its ruling).
export default defineCard({
  name: "Hangarback Walker",
  manaCost: "{X}{X}",
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 0,
  toughness: 0,
  text: `${ENTER_TEXT}\n${DIES_TEXT}\n${GROW_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: "x" } },
      text: ENTER_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Thopter Token",
        count: { countersOn: "source", counter: "+1/+1" },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: GROW_TEXT,
    },
  ],
});
