import { defineCard } from "../define.js";

const GRANT_TEXT = "Enchanted creature has indestructible.";
const MOVE_TEXT = "Whenever a creature enters, you may attach this Aura to that creature.";

// Any creature, an opponent's included: the move isn't a target, so hexproof
// or shroud doesn't stop it, but the Aura still has to be able to enchant it
// (protection from white does — rule 303.4d), or it stays where it is
// (rule 701.3b). "That creature" only while it is still the object that
// entered (rule 400.7).
export default defineCard({
  name: "Shielded by Faith",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\n${GRANT_TEXT}\n${MOVE_TEXT}`,
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["indestructible"],
      text: GRANT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Attach Shielded by Faith to that creature?",
        effect: { kind: "attach", target: "trigger-object" },
      },
      resolve: null,
      text: MOVE_TEXT,
    },
  ],
});
