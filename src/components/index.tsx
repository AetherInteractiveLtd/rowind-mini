import Roact, { PropsWithChildren } from "@rbxts/roact"
import { RunService } from "@rbxts/services"
import { ActiveStates, ObjectType, RowindClassEngine } from "../engine"

enum ApplyUpdate {
    Hover = "hover",
    Focus = "focus",
    Selected = "selected"
}

function changeActive(states: ActiveStates, transitionTicks: number, active: ApplyUpdate[]) {
    let tt2 = (transitionTicks * 2)
    if (active.includes(ApplyUpdate.Focus)) {
        // TODO: Apply transition delay.
        states.focus = math.min(math.floor(math.max(states.focus + (1 / transitionTicks), 0) * tt2) / tt2, 1)
    } else {
        states.focus = math.min(math.floor(math.max(states.focus - (1 / transitionTicks), 0) * tt2) / tt2, 1)
    }
    if (active.includes(ApplyUpdate.Selected)) {
        // TODO: Apply transition delay.
        states.selected = math.min(math.floor(math.max(states.selected + (1 / transitionTicks), 0) * tt2) / tt2, 1)
    } else {
        states.selected = math.min(math.floor(math.max(states.selected - (1 / transitionTicks), 0) * tt2) / tt2, 1)
    }
    if (active.includes(ApplyUpdate.Hover)) {
        // TODO: Apply transition delay.
        states.hover = math.min(math.floor(math.max(states.hover + (1 / transitionTicks), 0) * tt2) / tt2, 1)
    } else {
        states.hover = math.min(math.floor(math.max(states.hover - (1 / transitionTicks), 0) * tt2) / tt2, 1)
    }
}

interface RowindComponentProps<T extends ObjectType> {
    flavour: T,
    Text?: string,
    Image?: string,
    className: string,
}

class WorseRowindComponent<T extends ObjectType> extends Roact.Component<RowindComponentProps<T>, { activeState: ActiveStates }> {
    protected neededFrames: number = 0;

    private animationLength: number = 10;
    
    constructor(props: { flavour: T, Text?: string, className: string, Image?: string }) {
        super(props);

        this.state = { activeState: {} as ActiveStates };

        let active: ActiveStates = this.state.activeState;

        // TODO: find a better way of doing this.

        active.hover = 0;
        active.focus = 0;
        active.selected = 0;
        active.dark = 1;
        active.light = 0;
        active.motion = 0;
        active.colorblind = 0;
    }
    
    public render(): Roact.Element | undefined {
        let v = RowindClassEngine.gatherProperties(this.props.className, this.props.flavour, this.state.activeState);

        this.animationLength = v.UnprocessedData.data["animation-length"] as number ?? 10;

        switch (this.props.flavour) {
            case ObjectType.Div:
                return <frame {...v.Data} Event={{
                    MouseEnter: () => this.setActive(ApplyUpdate.Hover, this.animationLength),
                    MouseLeave: () => this.setInactive(ApplyUpdate.Hover, this.animationLength)
                }}>
                    {v.Children}
                    {this.props[Roact.Children]}
                </frame>
            case ObjectType.Span:
                return <textlabel {...v.Data} Event={{
                    MouseEnter: () => this.setActive(ApplyUpdate.Hover, this.animationLength),
                    MouseLeave: () => this.setInactive(ApplyUpdate.Hover, this.animationLength)
                }} Text={this.props.Text ?? ""}>
                    {v.Children}
                    {this.props[Roact.Children]}
                </textlabel>
            case ObjectType.Button:
                if (!this.props.Image) {
                    <textbutton {...v.Data} Event={{
                        MouseEnter: () => this.setActive(ApplyUpdate.Hover, this.animationLength),
                        MouseLeave: () => this.setInactive(ApplyUpdate.Hover, this.animationLength)
                    }} Text={this.props.Text ?? ""}>
                        {v.Children}
                        {this.props[Roact.Children]}
                    </textbutton>
                } else {
                    <imagebutton {...v.Data} Event={{
                        MouseEnter: () => this.setActive(ApplyUpdate.Hover, this.animationLength),
                        MouseLeave: () => this.setInactive(ApplyUpdate.Hover, this.animationLength)
                    }} Image={this.props.Image ?? ""}>
                        {v.Children}
                        {this.props[Roact.Children]}
                    </imagebutton>
                }
        }
    }

    public activeUpdates: ApplyUpdate[] = [];
    public setActive(typ: ApplyUpdate, ticks: number) {
        if (!this.activeUpdates.includes(typ)) {
            this.activeUpdates.push(typ);
        }
        this.setTransition(ticks);
    }
    public setInactive(typ: ApplyUpdate, ticks: number) {
        if (this.activeUpdates.includes(typ)) {
            this.activeUpdates.remove(this.activeUpdates.indexOf(typ));
        }
        this.setTransition(ticks);
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
        changeActive(this.state.activeState, this.animationLength, this.activeUpdates);
        this.setState(this.state);
    }
}

// Button,
// Input,
// Div,
// Span,

export function Div(props: PropsWithChildren<{ className: string }>) {
    return (<WorseRowindComponent flavour={ObjectType.Div} className={props.className}>{props[Roact.Children]}</WorseRowindComponent>)
}

export function Span(props: PropsWithChildren<{ className: string, Text: string }>) {
    return (<WorseRowindComponent flavour={ObjectType.Span} className={props.className} Text={props.Text}>{props[Roact.Children]}</WorseRowindComponent>)
}

export function Button(props: PropsWithChildren<{ className: string, Text: string, Image: string }>) {
    return (<WorseRowindComponent flavour={ObjectType.Button} className={props.className} Text={props.Text} Image={props.Image}>{props[Roact.Children]}</WorseRowindComponent>)
}