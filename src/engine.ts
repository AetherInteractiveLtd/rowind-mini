/* eslint-disable roblox-ts/lua-truthiness */
import Object from "@rbxts/object-utils";
import Roact, { Element } from "@rbxts/roact";
import { colors } from "./colors";
import { lerpAnything } from "./util/interpolate";

export type ActiveStates = Record<ElementState | keyof typeof VisibilitySettings, number>;

export enum ElementState {
	Hover = "hover",
	Focus = "focus",
	GamepadSelected = "selected",
}
export enum ObjectType {
	Button,
	Input,
	Div,
	Span,
}

export type PropertyApplier = (
	oldProperties: { [key: string]: unknown },
	getData: <X>(key: string) => X,
) => { [key: string]: unknown };
export type PropertyParser<T> = (
	key: string,
	parseStandard: (str: string) => T,
	stripStart: (str: string) => string,
) => [key: string, value: T];
export type RowindClassMap<T> = {
	directId?: string;
	predicate: (str: string) => boolean;
	applyProperties?: PropertyApplier;
	parseProperties: PropertyParser<T>;
};

export class ClassProcessor {
	static createNormal<T>(
		prefix: string,
		parseProperties: PropertyParser<T>,
		validObjectTypes: ObjectType[],
		applyProperties?: PropertyApplier,
	) {
		return this.createManual(
			(str) => str.sub(0, prefix.size()) === prefix,
			parseProperties,
			validObjectTypes,
			applyProperties,
		);
	}

	static createSpecial<T>(
		identifier: string,
		parseProperties: PropertyParser<T>,
		validObjectTypes: ObjectType[],
		applyProperties?: PropertyApplier,
	) {
		return this.createManual(
			(str) => str === identifier,
			parseProperties,
			validObjectTypes,
			applyProperties,
			identifier,
		);
	}

	static createManual<T>(
		predicate: (str: string) => boolean,
		parseProperties: PropertyParser<T>,
		validObjectTypes: ObjectType[],
		applyProperties?: PropertyApplier,
		directId?: string,
	) {
		const obj = {
			predicate,
			applyProperties,
			parseProperties,
			directId,
		} as never as RowindClassMap<never>;

		validObjectTypes.forEach((v) => {
			RowindClassEngine.addPredicateForObjectType(obj, v);
		});
	}
}

interface ReadyForProcessing {
	split: string[];

	stateDepth: number;

	depth: number;

	alpha: number;
}

const VisibilitySettings = {
	dark: false,
	light: true,
	motion: false,
	colorblind: false,
};

const active: ActiveStates = {} as ActiveStates;

active.hover = 0.5;
active.focus = 0;
active.selected = 0;
active.dark = 1;
active.light = 0;
active.motion = 0;
active.colorblind = 0;

export class RowindClassEngine {
	protected static readonly categorizedClassMap: Map<ObjectType, RowindClassMap<never>[]> = new Map();

	static addPredicateForObjectType(classMap: RowindClassMap<never>, objectType: ObjectType) {
		const prop = this.categorizedClassMap.get(objectType) ?? [];
		prop.push(classMap);
		this.categorizedClassMap.set(objectType, prop);
	}

	/**
	 * Supports most types of strings.
	 */
	static transformStringToValue(valStr: string): unknown {
		if (valStr in colors) {
			return colors[valStr as keyof typeof colors] as never;
		}

		// if (valStr.find("/")) {
		//     // PANIC! I don't support fractions yet, I'll let this be a number.
		// }

		const maybeANumber = tonumber(valStr.match("[%-0-9%.]+")[0]);
		if (maybeANumber) {
			return maybeANumber as never;
		}

		return valStr;
	}

	static gatherProperties(
		className: string,
		objectType: ObjectType,
		state: ActiveStates,
		secondaryClassName: string,
		secondaryAlpha: number,
	) {
		const dataObject = this.gatherDatapoints(className, objectType, state);
		const secondDataObject: {
			data: {
				[key: string]: unknown;
			};
			usedClasses: Set<RowindClassMap<never>>;
		} =
			secondaryClassName.size() > 0
				? this.gatherDatapoints(secondaryClassName, objectType, state)
				: ({} as {
						data: {
							[key: string]: unknown;
						};
						usedClasses: Set<RowindClassMap<never>>;
				  });

		let finalDataObject: { [key: string]: unknown } = {};
		let childrenArray: Roact.Element[] = [];

		for (const key of Object.keys(secondDataObject.data ?? [])) {
			let newData;
			if (key in dataObject.data) {
				const v = lerpAnything(
					dataObject.data[key] as number,
					secondDataObject.data[key] as number,
					secondaryAlpha,
				);

				newData = v;
			} else {
				newData = secondDataObject.data[key];
			}
			print(
				"Changed data for key",
				key,
				"from",
				dataObject.data[key],
				"and",
				secondDataObject.data[key],
				"to",
				newData,
				`(${secondaryAlpha})`,
			);
			dataObject.data[key] = newData;
		}

		dataObject.usedClasses.forEach((v) => {
			if (!v.applyProperties) return;
			finalDataObject = v.applyProperties(finalDataObject, ((k: string) => dataObject.data[k]) as never);

			if (finalDataObject.CHILDREN) {
				childrenArray = [...childrenArray, ...(finalDataObject.CHILDREN as Element[])];
			}

			finalDataObject.CHILDREN = undefined;
		});

		return {
			Data: finalDataObject,
			UnprocessedData: dataObject,
			Children: childrenArray,
		};
	}

	static gatherDatapoints(className: string, objectType: ObjectType, state: ActiveStates) {
		const classMaps = this.categorizedClassMap.get(objectType) ?? [];

		const usedClassesSet = new Set<RowindClassMap<never>>();

		const dataObject: { [key: string]: [v: unknown, depth: number, alpha: number][] } = {};

		const individualClasses = this.filterSignificantClasses(className.split(" "), state);

		individualClasses.forEach((v) => {
			const x = v.split;
			const actualClassName = x[x.size() - 1]!;

			let hasHadDirectMatch = false;
			classMaps.forEach((classMap) => {
				if (
					actualClassName === classMap.directId ||
					(classMap.predicate(actualClassName) && !hasHadDirectMatch)
				) {
					hasHadDirectMatch = actualClassName === classMap.directId;
					const insertable = classMap.parseProperties(
						actualClassName,
						(v: unknown) => this.transformStringToValue(v as string) as never,
						(str) => {
							const v = str.split("-");
							v.remove(0);
							return v.join("-");
						},
					);
					const insertSpace = dataObject[insertable[0]] ?? [];
					(insertSpace as defined[]).push([insertable[1], v.stateDepth, v.alpha]);
					usedClassesSet.add(classMap);
					dataObject[insertable[0]] = insertSpace;
				}
			});
		});

		const newDataObject: { [key: string]: unknown } = {};

		for (const key of Object.keys(dataObject)) {
			const forThisValue = dataObject[key].sort((one, two) => two[1] > one[1]);

			if (forThisValue.isEmpty()) continue;

			const deepestWithState = forThisValue[forThisValue.findIndex((v) => v[1] > 0)];
			const deepestWithoutState = forThisValue[forThisValue.findIndex((v) => v[1] === 0)];

			if (deepestWithState && deepestWithoutState) {
				const v = lerpAnything(
					deepestWithoutState[0] as number,
					deepestWithState[0] as number,
					deepestWithState[2],
				);

				newDataObject[key] = v;
			} else if (deepestWithState) {
				newDataObject[key] = deepestWithState[0];
			} else if (deepestWithoutState) {
				newDataObject[key] = deepestWithoutState[0];
			} else {
				continue;
			}
		}

		return { data: newDataObject, usedClasses: usedClassesSet };
	}

	static filterSignificantClasses(classNames: string[], state: ActiveStates): ReadyForProcessing[] {
		const valid: ReadyForProcessing[] = [];

		function add(split: string[], stateDepth: number, alpha: number, depth: number) {
			valid.push({
				split,
				stateDepth,
				alpha,
				depth,
			});
		}

		for (const currentSelector of classNames) {
			const split = currentSelector.split(":");

			let statedepth = 0;
			let depth = 0;
			let alpha = 0;
			let isValid = true;
			for (const query of split) {
				if (query === split[split.size() - 1]) continue;
				if (!isValid) continue;
				if (query in state) {
					if (state[query as keyof ActiveStates] === 0) {
						isValid = false;
						continue;
					}
					statedepth += 1;
					alpha += state.hover;

					continue;
				}
				// TODO: Implement the following.
				// if query in breakpoints
				// if query in custom user states
				if (query in VisibilitySettings) {
					if (VisibilitySettings[query as keyof typeof VisibilitySettings]) {
						depth += 1;
						continue;
					}
					isValid = false;
					continue;
				}

				// We're ignoring everything unknown because I'm just that lazy.
			}

			if (!isValid) continue;

			if (statedepth > 0) {
				add(split, statedepth, alpha / statedepth, depth);
			} else {
				add(split, statedepth, alpha, depth);
			}
		}

		return valid;
	}
}
