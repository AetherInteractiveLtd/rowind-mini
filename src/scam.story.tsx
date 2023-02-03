import Object from "@rbxts/object-utils"
import Roact from "@rbxts/roact";
import { colors } from "./colors";

enum ValType {
    Number,
    UDim,
    UDim2,
    Vector2,
    /**
     * black, white, gray*, red*, yellow*, green*, blue*, indigo*, purple*,
     * pink*, emerald*, amber*, slate*, zinc*, rose*, cyan*, violet*, fuschia*,
     * orange*, lime*, teal*, sky*, neutral*
     */
    Color,
    /**
     * [#ffffff]
     */
    Color3,
    /**
     * Special class?
     */
    Boolean,
    Enum,
    Special,
    String,
    Time
}

enum Keys {
    bgC3 = "BackgroundColor3",
    bgTrans = "BackgroundTransparency",
    bgHidden = "#bg-hidden",
    w = "#x-size",
    wAuto = "#x-auto",
    h = "#y-size",
    hAuto = "#y-auto"
}

const keys: { tag: string, special: { [key: string]: Keys }, [key: number]: Keys }[] = [
    { tag: "bg-", special: { "hidden": Keys.bgHidden }, [ValType.Color]: Keys.bgC3, [ValType.Color3]: Keys.bgC3, [ValType.Number]: Keys.bgTrans },
    { tag: "w-", special: { "auto": Keys.wAuto }, [ValType.Number]: Keys.w },
    { tag: "h-", special: { "auto": Keys.hAuto }, [ValType.Number]: Keys.h }
]

type ProcessInformation = {
    keyData: Map<Keys, unknown>;
}

function isArbitrary(value: string) {
    // [0] because LuaTuple is bad
    if (value.find("^%[.*%]$")[0]) {
        return true;
    }
    return false;
}

type TransformDirect<VT extends number> = {
    [ValType.Boolean]: boolean,
    [ValType.Color]: Color3,
    [ValType.Color3]: Color3,
    [ValType.Enum]: EnumItem,
    [ValType.Number]: number,
    [ValType.Special]: string,
    [ValType.UDim]: UDim,
    [ValType.UDim2]: UDim2,
    [ValType.Vector2]: Vector2
}[VT]

function processArbitrary<T extends ValType>(vType: T, v: string): TransformDirect<T> {
    let stripped = v.sub(1, v.size() - 1)

    return processNormal(vType, stripped);
}

function processNormal<T extends ValType>(vType: T, stripped: string): TransformDirect<T> {
    switch(vType) {
        case ValType.Boolean:
            return (stripped.lower() === "true") as TransformDirect<T>;
        case ValType.Color:
            warn("Something went wrong while processing Abritrary.");
            return undefined as TransformDirect<T>;
        case ValType.Color3:
            return Color3.fromHex(stripped) as TransformDirect<T>;
        case ValType.Enum:
            warn("Using arbitrary enums isn't possible yet")
            return stripped as TransformDirect<T>;
        case ValType.Time:
        case ValType.Number:
            return tonumber(stripped.match("[0-9%.]+")[0]) as TransformDirect<T>;
        default:
            return undefined as TransformDirect<T>;
    }
}

function processKeys(value: string, keyData: Map<Keys, unknown>) {
    let processData: ProcessInformation = {
        keyData
    };
    
    for (const [_, classData] of pairs(keys)) {
        let key = classData.tag;
        let minned = value.sub(0, key.size());
        if (minned === key) {
            let validKey: string = key;

            let valueOfClass = value.sub(key.size() + 1);

            let arbitrary = isArbitrary(valueOfClass);

            if (!arbitrary && ValType.Color in classData && valueOfClass in colors) {
                processData.keyData.set(classData[ValType.Color], colors[valueOfClass as keyof typeof colors]);
                break;
            }
            if (!arbitrary && ValType.Number in classData) {
                let num = processNormal(ValType.Number, valueOfClass);
                processData.keyData.set(classData[ValType.Number], num);
                break;
            }
            if (arbitrary && ValType.Number in classData) {
                let num = processArbitrary(ValType.Number, valueOfClass);
                processData.keyData.set(classData[ValType.Number], num);
                break;
            }
            if (arbitrary && ValType.Color3 in classData) {
                let color3 = processArbitrary(ValType.Color3, valueOfClass);
                processData.keyData.set(classData[ValType.Color], color3);
                break;
            }

            break;
        }
    }

    return keyData;
}

function styleFromKeyData(data: ProcessInformation) {
    let keyData = data.keyData;

    const BackgroundColor3 = keyData.get(Keys.bgC3) as Color3;
    
    let xAxis = keyData.get(Keys.w) as number;
    let xAuto = keyData.get(Keys.wAuto) as boolean;
    let yAxis = keyData.get(Keys.h) as number;
    let yAuto = keyData.get(Keys.hAuto) as boolean;
    const Size = new UDim2(0, xAxis, 0, yAxis);

    let object = {
        BackgroundColor3,
        Size
    }

    return object
}

class WorseRowindComponent extends Roact.Component<{ className: string }> {
    public render(): Roact.Element | undefined {
        let data: ProcessInformation = {
            keyData: new Map()
        }
        for (const name of this.props.className.split(" ")) {
            processKeys(name, data.keyData);
        }
        return <frame {...styleFromKeyData(data)}></frame>
    }
}

export = function(target: Instance) {
    print("-------")
    const baseString = "w-10";
    print(processKeys(baseString, new Map()))

    let tree = Roact.mount(<WorseRowindComponent className="bg-red-400 w-60 h-60" />, target, "UI");

    return function() {
        Roact.unmount(tree);
    }
}