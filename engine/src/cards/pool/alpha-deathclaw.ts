import type { TriggerSpec } from "../../abilities.js";
import { defineCard } from "../define.js";

// EDHREC rank 5486.
//
// Rulings:
//   [2024-03-08] Once a creature becomes monstrous, it can’t become monstrous again. If the
//     creature is already monstrous when the monstrosity ability resolves, nothing happens.
//   [2024-03-08] Monstrous isn’t an ability that a creature has. It’s just something true about
//     that creature. If the creature stops being a creature or loses its abilities, it will
//     continue to be monstrous.
//   [2024-03-08] An ability that triggers when a creature becomes monstrous won’t trigger if that
//     creature isn’t on the battlefield when its monstrosity ability resolves.

const DESTROY_TEXT = "When this creature enters or becomes monstrous, destroy target permanent.";
const MONSTROSITY_TEXT =
  "{5}{B}{G}: Monstrosity 4. (If this creature isn't monstrous, put four +1/+1 counters on it and it becomes monstrous.)";

const destroys = (trigger: TriggerSpec) =>
  ({
    trigger,
    targets: ["permanent"],
    effect: { kind: "destroy", target: 0 },
    resolve: null,
    text: DESTROY_TEXT,
  }) as const;

export default defineCard({
  name: "Alpha Deathclaw",
  manaCost: "{4}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Lizard", "Mutant"],
  power: 6,
  toughness: 6,
  keywords: ["menace", "trample"],
  text: `Menace, trample\n${DESTROY_TEXT}\n${MONSTROSITY_TEXT}`,
  activated: [
    {
      cost: { mana: "{5}{B}{G}", tap: false },
      targets: [],
      effect: { kind: "monstrosity", amount: 4 },
      resolve: null,
      text: MONSTROSITY_TEXT,
    },
  ],
  triggered: [
    destroys({ on: "enters-battlefield", who: "self" }),
    destroys({ on: "becomes-monstrous", who: "self" }),
  ],
});
