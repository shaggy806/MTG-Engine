import { defineCard } from "../define.js";

// Stun counters (rule 122.1d): while it has one, untapping it removes one
// instead — in its untap step, or by its own sacrifice trigger. Leaving the
// battlefield together with the lands sacrificed, it still sees them go (the
// ruling; rule 603.10a).
const ENTER_TEXT =
  "This creature enters tapped with six stun counters on it. (If a permanent with a stun counter would become untapped, remove one from it instead.)";
const BEAST_TEXT = "Whenever you sacrifice a land, create a tapped 4/4 green Beast creature token and untap this creature.";
const LIFE_TEXT = "{4}, Sacrifice a land: You gain 2 life.";

export default defineCard({
  name: "Baloth Prime",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 10,
  toughness: 10,
  text: `${ENTER_TEXT}\n${BEAST_TEXT}\n${LIFE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true, counters: { kind: "stun", amount: 6 } },
      text: ENTER_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Beast Token", count: 1, tapped: true },
          { kind: "untap", target: "source" },
        ],
      },
      resolve: null,
      text: BEAST_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{4}", tap: false, sacrifice: { filter: { type: "land" } } },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: LIFE_TEXT,
    },
  ],
});
