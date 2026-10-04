import { defineCard } from "../define.js";

// EDHREC rank 4258.
//
// Rulings:
//   [2024-07-26] If you control more than one Bird, the controller of the target spell still only
//     needs to pay {4}.

const unlessPays = (cost: string) =>
  ({
    kind: "unless",
    chooser: 0,
    options: [{ pay: cost, text: `Pay ${cost}` }],
    otherwise: { kind: "counter", target: 0 },
  }) as const;

export default defineCard({
  name: "Dazzling Denial",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell unless its controller pays {2}. If you control a Bird, counter that spell unless its controller pays {4} instead.",
  targets: ["spell"],
  // "Instead" — one tax, chosen by whether you control a Bird (any Bird
  // permanent) as it resolves.
  effect: {
    kind: "conditional",
    condition: { kind: "controls", filter: { subtype: "Bird" }, atLeast: 1 },
    then: unlessPays("{4}"),
    else: unlessPays("{2}"),
  },
});
