import { defineCard } from "../define.js";

const TEXT = "Whenever a player sacrifices another permanent, put a +1/+1 counter on each creature you control.";

// Any player's sacrifice, of anything but Mazirek itself — and still for the
// others when Mazirek goes with them (its ruling). A legend-rule move isn't
// a sacrifice.
export default defineCard({
  name: "Mazirek, Kraul Death Priest",
  manaCost: "{3}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Insect", "Shaman"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "sacrifice", who: "any", otherOnly: true },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
