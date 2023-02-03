import Roact, { JsxInstanceProperties } from "@rbxts/roact";
import { Players, RunService } from "@rbxts/services";
import { ActiveStates, gatherProperties, getCurrentlyApplicable, getRelevantSelectors } from "./properties";

enum ElementTypes {
    Button,
    Div,
    Text
}

function getBaseProps(className: string, active: ActiveStates, etype: ElementTypes) {
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
        const borderProps: JsxInstanceProperties<UIStroke> = {
            Thickness: gatherProperties("border", className, active) as number || 0,
            Transparency: gatherProperties("borderOpacity", className, active) as number || 0,
            Color: gatherProperties("borderColor", className, active) as Color3 || new Color3(0, 0, 0),
            LineJoinMode: hasRounded ? Enum.LineJoinMode.Round : Enum.LineJoinMode.Miter,
            ApplyStrokeMode: Enum.ApplyStrokeMode.Border // This prevents text from being stroked, we'll need to support this in the future.
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

enum ApplyUpdate {
    Hover,
    Focus,
    Selected,
    None
}

function changeActive(states: ActiveStates, active: ApplyUpdate[]) {
    if (active.includes(ApplyUpdate.Focus)) {
        // TODO: Apply transition delay.
        states.focus = math.max(states.focus + 0.1, 0)
    } else {
        states.focus = math.max(states.focus - 0.1, 0)
    }
    if (active.includes(ApplyUpdate.Selected)) {
        // TODO: Apply transition delay.
        states.selected = math.max(states.selected + 0.1, 0)
    } else {
        states.selected = math.max(states.selected - 0.1, 0)
    }
    if (active.includes(ApplyUpdate.Hover)) {
        // TODO: Apply transition delay.
        states.hover = math.max(states.hover + 0.1, 0)
    } else {
        states.hover = math.max(states.hover - 0.1, 0)
    }
}

type BaseRowindProps = { className: string, tagName: ElementTypes, creation: (_this: BaseRowindComponent, mystate: { states: ActiveStates }) => Roact.Element | Roact.Component }
class BaseRowindComponent extends Roact.Component<BaseRowindProps, { states: ActiveStates }> {
    constructor(props: BaseRowindProps) {
        super(props);

        let active: ActiveStates = (this.state as { [key: string]: unknown }).states = {} as ActiveStates;

        active.hover = 0;
        active.focus = 0;
        active.selected = 0;
        active.dark = 1;
        active.light = 0;
        active.motion = 0;
        active.colorblind = 0;
    }

    public render() {
        return <>
            {this.props.creation(this, this.state)}
        </>
    }

    public activeUpdates: ApplyUpdate[] = [];
    public setActive(typ: ApplyUpdate) {
        if (!this.activeUpdates.includes(typ)) {
            this.activeUpdates.push(typ);
        }
        this.setTransition(10);
    }
    public setInactive(typ: ApplyUpdate) {
        if (this.activeUpdates.includes(typ)) {
            this.activeUpdates.remove(this.activeUpdates.indexOf(typ));
        }
        this.setTransition(10);
    }

    public ticks = 0;
    public setTransition(ticks: number) {
        this.ticks = ticks;
    }

    public didMount(): void {
        this.startTransitions();
    }

    public connection?: RBXScriptConnection
    public startTransitions() {
        this.connection = RunService.RenderStepped.Connect(() => {
            if (this.ticks >= 0) {
                this.handleStates()
            }
            this.ticks -= 1;
        });
    }

    public willUnmount(): void {
        this.connection?.Disconnect();
    }

    public handleStates() {
        changeActive(this.state.states, this.activeUpdates);
        this.setState(this.state);
    }
}

export class CrappyDiv extends Roact.Component<{ className: string }> {
    public render(): Roact.Element {
        return <BaseRowindComponent className={this.props.className} tagName={ElementTypes.Div} creation={(_this: BaseRowindComponent, mystate: { states: ActiveStates }) => <frame Event={{
                MouseEnter: () => {_this.setActive(ApplyUpdate.Hover)},
                MouseLeave: () => {_this.setInactive(ApplyUpdate.Hover)}
            }} {...getBaseProps(this.props.className, mystate.states, ElementTypes.Button)}>
                {...getChildrenForProps(this.props.className, mystate.states)}
                {this.props[Roact.Children]}
            </frame>}></BaseRowindComponent>
    }
}

export class CrappyButton extends Roact.Component<{ className: string }> {
    public render(): Roact.Element {
        return <BaseRowindComponent className={this.props.className} tagName={ElementTypes.Button} creation={(_this: BaseRowindComponent, mystate: { states: ActiveStates }) => <frame Event={{
            MouseEnter: () => {_this.setActive(ApplyUpdate.Hover)},
            MouseLeave: () => {_this.setInactive(ApplyUpdate.Hover)}
        }} {...getBaseProps(this.props.className, mystate.states, ElementTypes.Button)}>
            {...getChildrenForProps(this.props.className, mystate.states)}
            {this.props[Roact.Children]}
        </frame>}></BaseRowindComponent>
    }
}

