import { defineCard } from "../define.js";

export default defineCard({
  name: "Darksteel Sentinel",
  manaCost: "{6}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 3,
  toughness: 3,
  keywords: ["flash", "vigilance", "indestructible"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nVigilance\nIndestructible (Damage and effects that say \"destroy\" don't destroy this creature. If its toughness is 0 or less, it's still put into its owner's graveyard.)",
});
