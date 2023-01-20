import Roact from "@rbxts/roact";
import { Players } from "@rbxts/services";
import { ActiveStates, gatherProperties, getCurrentlyApplicable, getRelevantSelectors } from "./properties";

let active: ActiveStates = {} as ActiveStates;

active.hover = 0;
active.focus = 0;
active.selected = 1;
active.dark = 1;
active.light = 1;
active.motion = 0;
active.colorblind = 0;

print(gatherProperties("bgColor", "dark:hover:bg-slate-300 dark:colorblind:hover:bg-slate-600 dark:bg-slate-500", active));

function getBaseProps(className: string, active: ActiveStates) {
    let BackgroundColor3: Color3 = gatherProperties("bgColor", className, active);
    let sizeW: UDim = gatherProperties("w", className, active);
    let sizeH: UDim = gatherProperties("h", className, active);
    let BorderSizePixel: number = gatherProperties("border", className, active) ?? 0;

    const AnchorPoint = gatherProperties("origin", className, active) as Vector2;

    const topVal: UDim = gatherProperties("top", className, active);
    const botVal: UDim = gatherProperties("bot", className, active);
    const leftVal: UDim = gatherProperties("left", className, active);
    const rightVal: UDim = gatherProperties("right", className, active);

    const LineHight = gatherProperties("leading", className, active) as number
    const FontWeight = gatherProperties("fontWeight", className, active) as Enum.FontWeight || Enum.FontWeight.Regular
    const textSizeVal = gatherProperties("text", className, active) as number

    const ZIndex = gatherProperties("z", className, active) as number

    let Size = (!!sizeW && !!sizeH) ? new UDim2(sizeW, sizeH) : new UDim2(1, 0, 1, 0);
    let Position = new UDim2(
        (leftVal || rightVal) ||  0, 
        (topVal || botVal) || 0
    );
    let Visible = true;

    // TODO: add bg-transparent special class.
    let BackgroundTransparency = BackgroundColor3 ? 0 : 1

    // Base stuff that kind of applies to all UIs.
    let elementBaseProps = {
        BorderSizePixel,
        Size,
        Position,
        Visible,
        AnchorPoint,
        BackgroundColor3,
        BackgroundTransparency,
        AutomaticSize: undefined,
        ZIndex
    }

    return elementBaseProps;
}

function getChildrenForProps(className: string, active: ActiveStates) {
    let children: Roact.Element[] = [];

    const hasRounded = !getRelevantSelectors("rounded", className, active).isEmpty();

    const Border = () => {
        const borderProps = {
            Thickness: gatherProperties("border", className, active) as number || 0,
            Transparency: gatherProperties("borderOpacity", className, active) as number || 0,
            Color: gatherProperties("borderColor", className, active) as Color3 || new Color3(0, 0, 0),
            LineJoinMode: hasRounded ? Enum.LineJoinMode.Round : Enum.LineJoinMode.Miter,
        }
        return <uistroke {...borderProps} />
    }

    const Rounded = () => {
        const roundedProps = {
            CornerRadius: gatherProperties("rounded", className, active) as UDim || new UDim(0, 0),
        }
        return <uicorner {...roundedProps}/>
    }

    const Padding = () => {
        const pVal = gatherProperties("p", className, active) as UDim
        const pbVal = gatherProperties("pb", className, active) as UDim
        const ptVal = gatherProperties("pt", className, active) as UDim
        const prVal = gatherProperties("pr", className, active) as UDim
        const plVal = gatherProperties("pl", className, active) as UDim

        const paddingProps = {
            PaddingBottom: pbVal || pVal,
            PaddingTop: ptVal || pVal,
            PaddingRight: prVal || pVal,
            PaddingLeft: plVal || pVal,
        }
        return <uipadding {...paddingProps}/>
    }

    if (hasRounded) {
        children.push(Rounded());
    }
    children.push(Padding());
    children.push(Border());

    return children;
}

class CrappyDiv extends Roact.Component<{ className: string }> {
    public render(): Roact.Element {
        return <screengui><frame {...getBaseProps(this.props.className, active)}>
            {...getChildrenForProps(this.props.className, active)}
        </frame></screengui>
    }
}

Roact.mount(<CrappyDiv className="bg-slate-300 w-20 h-20 rounded-lg" />, Players.PlayerAdded.Wait()[0].WaitForChild("PlayerGui"));
