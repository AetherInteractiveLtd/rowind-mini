import Roact from "@rbxts/roact";
import { ClassProcessor, ObjectType } from "../engine";

ClassProcessor.createSpecial(
    "bg-transparent",
    () => {
        return [ "transparent", true ]
    },
    [ ObjectType.Div, ObjectType.Span ],
    (properties, getValue) => {
        return { ...properties, BackgroundTransparency: getValue<boolean>("transparent") === true ? 1 : 0 };
    }
);

ClassProcessor.createSpecial(
    "richtext",
    () => {
        return [ "richtext", true ]
    },
    [ ObjectType.Span ],
    (properties, getValue) => {
        return { ...properties, RichText: getValue<boolean>("richtext") ?? false };
    }
);

ClassProcessor.createNormal(
    "bg-",
    (className: string, parseMe, stripStart) => {
        let stripped = stripStart(className);
        return [ "bgcol", parseMe(stripped) ];
    },
    [ ObjectType.Div, ObjectType.Span ],
    (properties, getValue) => {
        return { ...properties, BackgroundColor3: getValue<Color3>("bgcol") };
    },
);

const fonts = {
    Sono: 12187374537,
}

ClassProcessor.createNormal(
    "text-",
    (className: string, parseMe, stripStart) => {
        let stripped = stripStart(className);
        let v: unknown = parseMe(stripped);

        let isBuiltinFont = !!(Enum.Font.GetEnumItems().find(x => x.Name === v));

        if (typeIs(v, "Color3")) {
            return [ "text-color", v ];
        } else if (typeIs(v, "string") && (v in fonts || isBuiltinFont)) {
            let potentialFont = fonts[v as keyof typeof fonts]
            return [ "text-font", potentialFont ? Font.fromId(potentialFont) : Enum.Font[v as never] ];
        } else {
            return [ "text-size", v ];
        }
    },
    [ ObjectType.Span ],
    (properties, getValue) => {
        return { ...properties, Font: getValue<Font>("text-font") ?? Enum.Font.Arial, TextColor3: getValue<Color3>("text-color"), TextSize: getValue<number>("text-size") ?? 10 };
    },
);

ClassProcessor.createNormal(
    "weight-",
    (className: string, parseMe, stripStart) => {
        let stripped = stripStart(className);
        return [ "font-weight", parseMe(stripped) ];
    },
    [ ObjectType.Div ]
);

ClassProcessor.createNormal(
    "animation-",
    (className: string, parseMe, stripStart) => {
        let stripped = stripStart(className);
        return [ "animation-length", parseMe(stripped) ];
    },
    [ ObjectType.Div ]
);

function isPercentage(str: string) {
    if (str.sub(str.size()) === "%") {
        return true;
    }
    return false;
}

print(isPercentage("200%"));

ClassProcessor.createNormal(
    "w-",
    (className: string, parseMe, stripStart) => {
        let stripped = stripStart(className);
        if (isPercentage(stripped)) {
            return [ "width-scale", parseMe(stripped) ]
        } else {
            return [ "width", parseMe(stripped) ];
        }
    },
    [ ObjectType.Div, ObjectType.Span ]
);

ClassProcessor.createNormal(
    "h-",
    (className: string, parseMe, stripStart) => {
        let stripped = stripStart(className);
        if (isPercentage(stripped)) {
            return [ "height-scale", parseMe(stripped) ]
        } else {
            return [ "height", parseMe(stripped) ];
        }
    },
    [ ObjectType.Div, ObjectType.Span ],
    (properties, getValue) => {
        return {
            ...properties,
            Size: new UDim2((getValue<number>("width-scale") ?? 0) / 100, getValue<number>("width") ?? 0, (getValue<number>("height-scale") ?? 0) / 100, getValue<number>("height") ?? 0)
        };
    },
);

ClassProcessor.createNormal(
    "rounded-",
    (className: string, parseMe, stripStart) => {
        let stripped = stripStart(className);
        return [ "rounded", parseMe(stripped) ];
    },
    [ ObjectType.Div, ObjectType.Span ],
    (properties, getValue) => {
        const vRounded = getValue<number>("rounded");

        if (!vRounded) return properties;
        return {
            ...properties,
            CHILDREN: [
                <uicorner CornerRadius={new UDim(0, vRounded)}></uicorner>
            ]
        }
    },
);

ClassProcessor.createNormal(
    "offset-",
    (className: string, parseMe, stripStart) => {
        let stripped = stripStart(className);
        if (isPercentage(stripped)) {
            return [ "item-offset-scale", parseMe(stripped) ]
        } else {
            return [ "item-offset", parseMe(stripped) ];
        }
    },
    [ ObjectType.Div ]
);

ClassProcessor.createNormal(
    "flex-",
    (className: string, _, stripStart) => {
        let stripped = stripStart(className);
        return [ "flex", stripped ];
    },
    [ ObjectType.Div ],
    (properties, getValue) => {
        const flex = getValue<string>("flex");

        function mapFlexJustifiers<T extends 'horizontal' | 'vertical'>(v: string, kind: T): T extends 'horizontal' ? Enum.HorizontalAlignment : Enum.VerticalAlignment {
            switch (v) {
                case 'center': return kind === 'horizontal' ? Enum.HorizontalAlignment.Center as never : Enum.VerticalAlignment.Center as never;
                case 'left': return Enum.HorizontalAlignment.Left as never;
                case 'bottom': return Enum.VerticalAlignment.Bottom as never;
                case 'right': return Enum.HorizontalAlignment.Right as never;
                case 'top': return Enum.VerticalAlignment.Top as never;
                default: return undefined as never;
            }
        }

        if (!flex) return properties;
        return {
            ...properties,
            CHILDREN: [
                <uilistlayout
                    FillDirection={Enum.FillDirection.Vertical}
                    HorizontalAlignment={mapFlexJustifiers(flex.split("-")[0], 'horizontal')}
                    VerticalAlignment={mapFlexJustifiers(flex.split("-")[0], 'vertical')}
                    Padding={new UDim(getValue<number>("item-offset-scale"), getValue<number>("item-offset"))}
                />
            ]
        }
    },
);

ClassProcessor.createNormal(
    "border-",
    (className: string, parseMe, stripStart) => {
        let stripped = parseMe(stripStart(className));
        
        if (typeOf(stripped) === "Color3") {
            return [ "border", stripped ];
        } else {
            return [ "border-width", stripped];
        }
    },
    [ ObjectType.Div ],
    (properties, getValue) => {
        const flex = getValue<Color3>("border");
        const borderWidth = getValue<number>("border-width") ?? 0;

        if (!flex) return properties;
        return {
            ...properties,
            CHILDREN: [
                <uistroke
                    Color={flex}
                    Thickness={borderWidth}
                />
            ]
        }
    },
);

export {};