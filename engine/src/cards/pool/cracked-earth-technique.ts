import { defineCard } from "../define.js";

// Rulings:
//   [2025-10-02] You can target the same land or two different lands with the multiple instances
//     of earthbend from Cracked Earth Technique.
//   [2025-10-02] If the targeted land becomes an illegal target before the spell or ability that
//     includes earthbend resolves, earthbend does nothing. If the spell or ability didn't have
//     other targets, it won't resolve.
//   [2025-10-02] You may target a land that is already a creature, perhaps because of a previous
//     earthbend ability. The land will get the +1/+1 counters, gain haste, and have its base power
//     and toughness set to 0/0.
//
// Each earthbend is its own instance of the word "target", so the two slots
// may name the same land (rule 115.3); the second sets it to 0/0 again and
// adds three more counters (Badgermole's `earthbend` effect).
export default defineCard({
  name: "Cracked Earth Technique",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["sorcery"],
  subtypes: ["Lesson"],
  text: "Earthbend 3, then earthbend 3. You gain 3 life. (To earthbend 3, target land you control becomes a 0/0 creature with haste that's still a land. Put three +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)",
  targets: ["land-you-control", "land-you-control"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "earthbend", target: 0, amount: 3 },
      { kind: "earthbend", target: 1, amount: 3 },
      { kind: "gain-life", amount: 3 },
    ],
  },
});
