/* eslint-disable roblox-ts/lua-truthiness */
import Roact from "@rbxts/roact";
import { ClassProcessor, ObjectType } from "../engine";

ClassProcessor.createSpecial(
	"bg-transparent",
	() => {
		return ["transparent", true];
	},
	[ObjectType.Div, ObjectType.CanvasDiv, ObjectType.Input, ObjectType.Span, ObjectType.Button],
	(properties, getValue) => {
		return { ...properties, BackgroundTransparency: getValue<boolean>("transparent") === true ? 1 : 0 };
	},
);

ClassProcessor.createSpecial(
	"richtext",
	() => {
		return ["richtext", true];
	},
	[ObjectType.Input, ObjectType.Span, ObjectType.Button],
	(properties, getValue) => {
		return { ...properties, RichText: getValue<boolean>("richtext") ?? false };
	},
);

ClassProcessor.createSpecial(
	"clip",
	() => {
		return ["clip", true];
	},
	[ObjectType.Div, ObjectType.CanvasDiv, ObjectType.Input, ObjectType.Span, ObjectType.Button],
	(properties, getValue) => {
		return { ...properties, ClipsDescendants: getValue<boolean>("clip") };
	},
);

ClassProcessor.createSpecial(
	"scaled",
	() => {
		return ["scaled", true];
	},
	[ObjectType.Input, ObjectType.Span, ObjectType.Button],
	(properties, getValue) => {
		return { ...properties, TextScaled: getValue<boolean>("scaled") };
	},
);

ClassProcessor.createNormal(
	"bg-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className);
		const v = parseMe(stripped);
		if (typeIs(v, "number")) {
			return ["bg-transparency", v];
		} else {
			return ["bgcol", v];
		}
	},
	[ObjectType.Div, ObjectType.CanvasDiv, ObjectType.Input, ObjectType.Span, ObjectType.Button],
	(properties, getValue) => {
		return {
			...properties,
			BackgroundTransparency:
				(getValue<boolean>("transparent") ? 1 : undefined) ?? getValue<number>("bg-transparency") ?? 0,
			BackgroundColor3: getValue<Color3>("bgcol"),
		};
	},
);

const fonts = {
	Sono: 12187374537,
};

ClassProcessor.createNormal(
	"align-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className);
		return [
			"text-align",
			stripped === "left"
				? Enum.TextXAlignment.Left
				: stripped === "center"
				? Enum.TextXAlignment.Center
				: Enum.TextXAlignment.Right,
		];
	},
	[ObjectType.Input, ObjectType.Span, ObjectType.Button],
);

ClassProcessor.createNormal(
	"text-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className);
		const v: unknown = parseMe(stripped);

		const isBuiltinFont = !!Enum.Font.GetEnumItems().find((x) => x.Name === v);

		if (v === "truncate") {
			return ["text-truncate", Enum.TextTruncate.AtEnd];
		} else if (typeIs(v, "Color3")) {
			return ["text-color", v];
		} else if (typeIs(v, "string") && (v in fonts || isBuiltinFont)) {
			const potentialFont = fonts[v as keyof typeof fonts];
			return ["text-font", potentialFont ? Font.fromId(potentialFont) : Font.fromEnum(Enum.Font[v as never])];
		} else {
			return ["text-size", v];
		}
	},
	[ObjectType.Span, ObjectType.Input, ObjectType.Button],
	(properties, getValue) => {
		const TextSize = getValue<number>("text-size");
		return {
			...properties,
			TextXAlignment: getValue<Enum.TextXAlignment>("text-align") ?? Enum.TextXAlignment.Left,
			FontFace: getValue<Font>("text-font") ?? Font.fromEnum(Enum.Font.Arial),
			TextColor3: getValue<Color3>("text-color"),
			TextSize: TextSize ?? 10,
			TextTruncate: getValue<Enum.TextTruncate>("text-truncate") ?? Enum.TextTruncate.None,
		};
	},
);

ClassProcessor.createNormal(
	"weight-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className);
		return ["font-weight", parseMe(stripped)];
	},
	[ObjectType.Input, ObjectType.Span, ObjectType.Button],
);

ClassProcessor.createNormal(
	"animation-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className);
		return ["animation-length", parseMe(stripped)];
	},
	[ObjectType.Div, ObjectType.CanvasDiv, ObjectType.Input, ObjectType.Span, ObjectType.Button],
);

ClassProcessor.createNormal(
	"ease-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className);
		return ["easing-style", parseMe(stripped)];
	},
	[ObjectType.Div, ObjectType.CanvasDiv, ObjectType.Input, ObjectType.Span, ObjectType.Button],
);

function isPercentage(str: string) {
	if (str.sub(str.size()) === "%") {
		return true;
	}
	return false;
}

ClassProcessor.createNormal(
	"x-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className);
		if (isPercentage(stripped)) {
			return ["x-scale", parseMe(stripped)];
		} else {
			return ["x", parseMe(stripped)];
		}
	},
	[ObjectType.Div, ObjectType.CanvasDiv, ObjectType.Input, ObjectType.Span, ObjectType.Button],
);

ClassProcessor.createNormal(
	"y-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className);
		if (isPercentage(stripped)) {
			return ["y-scale", parseMe(stripped)];
		} else {
			return ["y", parseMe(stripped)];
		}
	},
	[ObjectType.Div, ObjectType.CanvasDiv, ObjectType.Input, ObjectType.Span, ObjectType.Button],
);

ClassProcessor.createNormal(
	"w-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className);
		if (isPercentage(stripped)) {
			return ["width-scale", parseMe(stripped)];
		} else {
			return ["width", parseMe(stripped)];
		}
	},
	[ObjectType.Div, ObjectType.CanvasDiv, ObjectType.Input, ObjectType.Span, ObjectType.Button],
);

ClassProcessor.createNormal(
	"h-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className);
		if (isPercentage(stripped)) {
			return ["height-scale", parseMe(stripped)];
		} else {
			return ["height", parseMe(stripped)];
		}
	},
	[ObjectType.Div, ObjectType.CanvasDiv, ObjectType.Input, ObjectType.Span, ObjectType.Button],
	(properties, getValue) => {
		return {
			...properties,
			Size: new UDim2(
				(getValue<number>("width-scale") ?? 0) / 100, // xScale
				getValue<number>("width") ?? 0, // xOffset
				(getValue<number>("height-scale") ?? 0) / 100, // yScale
				getValue<number>("height") ?? 0,
			), // yOffset
			Position: new UDim2(
				(getValue<number>("x-scale") ?? 0) / 100, // xScale
				getValue<number>("x") ?? 0, // xOffset
				(getValue<number>("y-scale") ?? 0) / 100, // yScale
				getValue<number>("y") ?? 0,
			), // yOffset
		};
	},
);

ClassProcessor.createNormal(
	"aspect-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className);
		return ["aspectratio", parseMe(stripped)];
	},
	[ObjectType.Div, ObjectType.CanvasDiv, ObjectType.Input, ObjectType.Span, ObjectType.Button],
	(properties, getValue) => {
		return {
			...properties,
			CHILDREN: [
				<uiaspectratioconstraint AspectRatio={getValue<number>("aspectratio") ?? 1}></uiaspectratioconstraint>,
			],
		};
	},
);

ClassProcessor.createNormal(
	"rotation-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className);
		return ["rotation", parseMe(stripped)];
	},
	[ObjectType.Div, ObjectType.CanvasDiv, ObjectType.Input, ObjectType.Span, ObjectType.Button],
	(properties, getValue) => {
		return {
			...properties,
			Rotation: getValue<number>("rotation"),
		};
	},
);

ClassProcessor.createNormal(
	"transparency-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className);
		return ["gtransparency", parseMe(stripped)];
	},
	[ObjectType.CanvasDiv],
	(properties, getValue) => {
		return {
			...properties,
			GroupTransparency: getValue<number>("gtransparency"),
		};
	},
);

ClassProcessor.createNormal(
	"rounded-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className);
		return ["rounded", parseMe(stripped)];
	},
	[ObjectType.Div, ObjectType.CanvasDiv, ObjectType.Input, ObjectType.Span, ObjectType.Button],
	(properties, getValue) => {
		const vRounded = getValue<number>("rounded");

		if (!vRounded) return properties;
		return {
			...properties,
			CHILDREN: [<uicorner CornerRadius={new UDim(0, vRounded)}></uicorner>],
		};
	},
);

ClassProcessor.createNormal(
	"offset-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className);
		if (isPercentage(stripped)) {
			return ["item-offset-scale", parseMe(stripped)];
		} else {
			return ["item-offset", parseMe(stripped)];
		}
	},
	[ObjectType.Div, ObjectType.CanvasDiv],
);

ClassProcessor.createNormal(
	"anchor-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className).split("-");
		return ["anchor", new Vector2((parseMe(stripped[0]) as number) ?? 0, (parseMe(stripped[1]) as number) ?? 0)];
	},
	[ObjectType.Div, ObjectType.CanvasDiv, ObjectType.Input, ObjectType.Span, ObjectType.Button],
	(properties, getValue) => {
		return {
			...properties,
			AnchorPoint: getValue<Vector2>("anchor"),
		};
	},
);

ClassProcessor.createNormal(
	"cellw-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className);
		if (isPercentage(stripped)) {
			return ["cellw-scale", parseMe(stripped)];
		} else {
			return ["cellw-offset", parseMe(stripped)];
		}
	},
	[ObjectType.Div, ObjectType.CanvasDiv],
);

ClassProcessor.createNormal(
	"cellh-",
	(className: string, parseMe, stripStart) => {
		const stripped = stripStart(className);
		if (isPercentage(stripped)) {
			return ["cellh-scale", parseMe(stripped)];
		} else {
			return ["cellh-offset", parseMe(stripped)];
		}
	},
	[ObjectType.Div, ObjectType.CanvasDiv],
);

ClassProcessor.createNormal(
	"maxlinesize-",
	(className: string, _, stripStart) => {
		const stripped = stripStart(className);
		return ["maxlinesize", stripped];
	},
	[ObjectType.Div, ObjectType.CanvasDiv],
);

ClassProcessor.createNormal(
	"flex-",
	(className: string, _, stripStart) => {
		const stripped = stripStart(className);
		return ["flex", stripped];
	},
	[ObjectType.Div, ObjectType.CanvasDiv],
	(properties, getValue) => {
		const flex = getValue<string>("flex");

		function mapFlexJustifiers<T extends "horizontal" | "vertical">(
			v: string,
			kind: T,
		): T extends "horizontal" ? Enum.HorizontalAlignment : Enum.VerticalAlignment {
			if (v === "center") {
				return kind === "horizontal"
					? (Enum.HorizontalAlignment.Center as never)
					: (Enum.VerticalAlignment.Center as never);
			}

			if (kind === "horizontal") {
				switch (v) {
					case "left":
						return Enum.HorizontalAlignment.Left as never;
					case "right":
						return Enum.HorizontalAlignment.Right as never;
					default:
						return Enum.HorizontalAlignment.Left as never;
				}
			} else {
				switch (v) {
					case "bottom":
						return Enum.VerticalAlignment.Bottom as never;
					case "top":
						return Enum.VerticalAlignment.Top as never;
					default:
						return Enum.VerticalAlignment.Top as never;
				}
			}
		}

		if (!flex) return properties;
		return {
			...properties,
			CHILDREN: [
				<uigridlayout
					FillDirection={getValue<Enum.FillDirection>("direction") ?? Enum.FillDirection.Vertical}
					HorizontalAlignment={mapFlexJustifiers(flex.size() > 1 ? flex.split("-")[0] : flex, "horizontal")}
					VerticalAlignment={mapFlexJustifiers(flex.size() > 1 ? flex.split("-")[1] : flex, "vertical")}
					CellPadding={
						new UDim2(
							(getValue<number>("item-offset-scale") ?? 0) / 100,
							getValue<number>("item-offset"),
							(getValue<number>("item-offset-scale") ?? 0) / 100,
							getValue<number>("item-offset"),
						)
					}
					CellSize={
						new UDim2(
							(getValue<number>("cellw-scale") ?? 0) / 100,
							getValue<number>("cellw-offset") ?? 100,
							(getValue<number>("cellh-scale") ?? 0) / 100,
							getValue<number>("cellh-offset") ?? 100,
						)
					}
					FillDirectionMaxCells={getValue<number>("maxlinesize") ?? 0}
				/>,
			],
		};
	},
);

ClassProcessor.createNormal(
	"direction-",
	(className: string, _, stripStart) => {
		const stripped = stripStart(className);
		return ["direction", stripped === "vertical" ? Enum.FillDirection.Vertical : Enum.FillDirection.Horizontal];
	},
	[ObjectType.Div, ObjectType.CanvasDiv],
);

ClassProcessor.createNormal(
	"border-",
	(className: string, parseMe, stripStart) => {
		const stripped = parseMe(stripStart(className));

		if (typeOf(stripped) === "Color3") {
			return ["border", stripped];
		} else {
			return ["border-width", stripped];
		}
	},
	[ObjectType.Div, ObjectType.CanvasDiv, ObjectType.Input, ObjectType.Span, ObjectType.Button],
	(properties, getValue) => {
		const border = getValue<Color3>("border");
		const borderWidth = getValue<number>("border-width") ?? 0;

		if (!(border || borderWidth)) return properties;
		return {
			...properties,
			BorderSizePixel: 0,
			CHILDREN: [
				<uistroke
					ApplyStrokeMode={Enum.ApplyStrokeMode.Border}
					Color={border ?? new Color3(80, 80, 255)}
					Thickness={borderWidth}
				/>,
			],
		};
	},
);

// padding is processed such that:
// if 1 _ _ _ is specified, we do 1 on every side,
// if 1 2 _ _ is specified, we do 1 on every horizontal side, and 2 on every vertical side,
// if 1 2 3 _ is specified, we do 1 on every horizontal side, and 2 on every vertical side,
// if 1 2 3 4 is specified, we do 1, 2, 3, and 4 on every side starting from left to top to bottom to right.
ClassProcessor.createNormal(
	"padding-",
	(className: string, parseMe, stripStart) => {
		const stripped = parseMe(stripStart(className));

		return ["padding", stripped];
	},
	[ObjectType.Div, ObjectType.CanvasDiv, ObjectType.Input, ObjectType.Span, ObjectType.Button],
	(properties, getValue) => {
		let padding = getValue<string>("padding").split("-");

		const count = padding.size();

		if (count === 1) {
			padding = [padding[0], padding[0], padding[0], padding[0]];
		} else if (count === 2 || count === 3) {
			padding = [padding[0], padding[1], padding[1], padding[0]];
		} else if (count < 1 || count > 4) {
			warn("Too many or too few padding arguments provided, always have between 1 and 4.");
			return properties;
		}

		const isLPadPercent = isPercentage(padding[0]);
		const paddingLeft = new UDim(
			isLPadPercent ? (tonumber(padding[0]) ?? 0) / 100 : 0,
			isLPadPercent ? 0 : tonumber(padding[0]),
		);
		const isTPadPercent = isPercentage(padding[0]);
		const paddingTop = new UDim(
			isTPadPercent ? (tonumber(padding[1]) ?? 0) / 100 : 0,
			isTPadPercent ? 0 : tonumber(padding[1]),
		);
		const isBPadPercent = isPercentage(padding[0]);
		const paddingBottom = new UDim(
			isBPadPercent ? (tonumber(padding[2]) ?? 0) / 100 : 0,
			isBPadPercent ? 0 : tonumber(padding[2]),
		);
		const isRPadPercent = isPercentage(padding[0]);
		const paddingRight = new UDim(
			isRPadPercent ? (tonumber(padding[3]) ?? 0) / 100 : 0,
			isRPadPercent ? 0 : tonumber(padding[3]),
		);

		return {
			...properties,
			BorderSizePixel: 0,
			CHILDREN: [
				<uipadding
					PaddingLeft={paddingLeft}
					PaddingTop={paddingTop}
					PaddingBottom={paddingBottom}
					PaddingRight={paddingRight}
				/>,
			],
		};
	},
);

export {};
