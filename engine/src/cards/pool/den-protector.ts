import { defineCard } from "../define.js";

const EVADE_TEXT = "Creatures with power less than this creature's power can't block it.";
const RETURN_TEXT = "When this creature is turned face up, return target card from your graveyard to your hand.";

// Powers are compared only as blockers are declared (the ruling) — Champion
// of Lambholt's restriction, on itself. Megamorph {1}{G} (rule 702.37b): a
// +1/+1 counter as it's turned face up for that cost, and the trigger as it
// is, however it's turned.
export default defineCard({
  name: "Den Protector",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 1,
  text: `${EVADE_TEXT}\nMegamorph {1}{G}\n${RETURN_TEXT}`,
  morph: { keyword: "megamorph", cost: "{1}{G}" },
  static: [
    {
      affects: { scope: "self" },
      cantBeBlockedBy: { power: { op: "lt", n: { amount: { powerOf: "source" } } } },
      text: EVADE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "turned-face-up", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you" }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
