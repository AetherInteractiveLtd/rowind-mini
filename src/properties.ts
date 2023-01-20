import { slice } from "./util/slice";

const testString = "dark:hover:bg-slate-300 dark:colorblind:hover:bg-slate-600 dark:bg-slate-500";

import { classes } from "./classes";
import { lerpAnything } from "./util/interpolate";

export const breakpoints = {
    default: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
    "3xl": 1920,
}

export enum ElementState {
    Hover = "hover",
    Focus = "focus",
    GamepadSelected = "selected"
}

export enum VisibilitySettings {
    Dark = "dark",
    Light = "light",
    ReducedMotion = "motion",
    Colorblind = "colorblind",
}

export type ActiveStates = Record<ElementState | VisibilitySettings, number>;

export function getRelevantSelectors(loc: keyof typeof classes, str: string, active: ActiveStates) {
    let locationDesc = classes[loc];

    let parts = str.split(" ");

    let relevantSelectors: string[] = [];
    parts.forEach(currentSelector => {
        let split = currentSelector.split(":");
        let last = split[split.size() - 1];
        if ((locationDesc as { [key: string]: unknown })[last]) {
            relevantSelectors.push(currentSelector);
        }
    });

    return relevantSelectors;
}

export function getCurrentlyApplicable(loc: keyof typeof classes, str: string, active: ActiveStates) {
    let relevantSelectors = getRelevantSelectors(loc, str, active);

    let mostRelevantSelectors: [string, number, number, boolean][] = [];

    function add(t: string, alpha: number, depth: number, hasState: boolean) {
      mostRelevantSelectors.push([t, alpha, depth, hasState]);
    }

    relevantSelectors.forEach(currentSelector => {
        let split = currentSelector.split(":");
        split = slice(split, 0, split.size() - 1);

        let statedepth = 0;
        let depth = 0;
        let alpha = 0;
        for (const query of split) {
          if (query === ElementState.Hover) {
            if (active.hover === 0 || statedepth !== 0) return;
            statedepth += 1;
            alpha += active.hover;
          }
          if (query === ElementState.Focus) {
            if (active.focus === 0 || statedepth !== 0) return;
            statedepth += 1;
            alpha += active.focus;
          }
          if (query === ElementState.GamepadSelected) {
            if (active.selected === 0 || statedepth !== 0) return;
            statedepth += 1;
            alpha += active.selected;
          }
          if (query === VisibilitySettings.Dark) {
            if (active.dark === 0) return;
            depth += 1;
          }
          if (query === VisibilitySettings.Light) {
            if (active.light === 0) return;
            depth += 1;
          }
          if (query === VisibilitySettings.ReducedMotion) {
            if (active.motion === 0) return;
            depth += 1;
          }
          if (query === VisibilitySettings.Colorblind) {
            if (active.colorblind === 0) return;
            depth += 1;
          }
          if (query in breakpoints) {
            if (breakpoints[query as keyof typeof breakpoints]) {
                // TODO: Do thing here idrk.
            }
          }
        }

        if (statedepth > 0) {
          add(currentSelector, alpha / statedepth, depth, statedepth > 0);
        } else {
          add(currentSelector, alpha, depth, statedepth > 0);
        }
    });

    mostRelevantSelectors = mostRelevantSelectors.sort(([_, __, depth], [___, ____, depth2]) => depth2 > depth)

    const mostRelevantStateless = mostRelevantSelectors.findIndex(([_, __, ___, hasState]) => {
      return !hasState;
    });
    const mostRelevantStateful = mostRelevantSelectors.findIndex(([_, __, ___, hasState]) => {
      return hasState;
    })

    return [mostRelevantSelectors[mostRelevantStateless], mostRelevantSelectors[mostRelevantStateful]];
}


// TODO: fix these stupid types.
export function getValue<T extends keyof typeof classes>(name: T, classField: string): ExtractKeys<(typeof classes)[T], keyof (typeof classes)[T]> {
    let split = classField.split(":");

    let value = classes[name][split[split.size() - 1] as never];
    
    return value;
}

export function gatherProperties(name: keyof typeof classes, classField: string, active: ActiveStates): never {
    let [stateless, stateful] = getCurrentlyApplicable(name, classField, active);

    let finalValue;
    let statelessVal;
    if (stateless) {
        statelessVal = getValue(name, stateless[0]);
    }
    if (stateful) {
      let statefulVal = getValue(name, stateful[0]);

      finalValue = lerpAnything(statelessVal ?? statefulVal, statefulVal, stateful[1]);
    } else {
      finalValue = statelessVal;
    }

    return finalValue as never;
}

// getCurrentlyApplicable("bgColor", testString)