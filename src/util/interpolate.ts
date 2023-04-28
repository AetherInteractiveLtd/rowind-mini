type Interpolatable = Vector2 | Vector3 | Color3 | UDim2 | UDim | number | boolean | EnumItem;

/*
   This will Lerp literally any Roblox datatype (within reason)
 */
export function lerpAnything<T extends Interpolatable>(a: T, b: T, alpha: number): T {
	if (typeIs(a, "number")) {
		return (a * (1 - alpha) + (b as number) * alpha) as T;
	} else if (typeIs(a, "Vector2")) {
		return a.Lerp(b as Vector2, alpha) as T;
	} else if (typeIs(a, "Vector3")) {
		return a.Lerp(b as Vector3, alpha) as T;
	} else if (typeIs(a, "UDim")) {
		return new UDim(
			lerpAnything(a.Scale, (b as UDim).Scale, alpha),
			lerpAnything(a.Offset, (b as UDim).Offset, alpha),
		) as T;
	} else if (typeIs(a, "UDim2")) {
		return a.Lerp(b as UDim2, alpha) as T;
	} else if (typeIs(a, "EnumItem")) {
		return alpha >= 0.5 ? a : b;
	} else if (typeIs(a, "Color3")) {
		return a.Lerp(b as Color3, alpha) as T;
	} else if (typeIs(a, "boolean")) {
		return alpha >= 0.5 ? a : b;
	} else {
		return alpha >= 0.5 ? a : b;
	}
}
