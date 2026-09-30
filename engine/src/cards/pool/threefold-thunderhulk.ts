import { defineCard } from "../define.js";

const ENTER_TEXT = "This creature enters with three +1/+1 counters on it.";
const GNOME_TEXT =
  "Whenever this creature enters or attacks, create a number of 1/1 colorless Gnome artifact creature tokens equal to its power.";
const GROW_TEXT = "{2}, Sacrifice another artifact: Put a +1/+1 counter on this creature.";

const GNOMES = { kind: "create-token", token: "Gnome Token", count: { powerOf: "source" } } as const;

export default defineCard({
  name: "Threefold Thunderhulk",
  manaCost: "{7}",
  types: ["artifact", "creature"],
  subtypes: ["Gnome"],
  power: 0,
  toughness: 0,
  text: `${ENTER_TEXT}\n${GNOME_TEXT}\n${GROW_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: 3 } },
      text: ENTER_TEXT,
    },
  ],
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, targets: [], effect: GNOMES, resolve: null, text: GNOME_TEXT },
    { trigger: { on: "attacks", who: "self" }, targets: [], effect: GNOMES, resolve: null, text: GNOME_TEXT },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: { filter: { type: "artifact" } } },
      otherOnly: true,
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: GROW_TEXT,
    },
  ],
});
