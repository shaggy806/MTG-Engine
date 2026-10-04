import { defineCard } from "../define.js";

// EDHREC rank 4600.

export default defineCard({
  name: "Hunted Horror",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Horror"],
  power: 7,
  toughness: 7,
  keywords: ["trample"],
  text: "Trample\nWhen this creature enters, target opponent creates two 3/3 green Centaur creature tokens with protection from black.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      // Dowsing Dagger's shape: the target opponent creates them.
      targets: ["opponent"],
      effect: { kind: "create-token", token: "Centaur Token", count: 2, who: "target-controller" },
      resolve: null,
      text: "When this creature enters, target opponent creates two 3/3 green Centaur creature tokens with protection from black.",
    },
  ],
});
