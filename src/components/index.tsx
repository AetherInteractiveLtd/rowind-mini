/* eslint-disable roblox-ts/lua-truthiness */
/* eslint-disable prefer-const */
import Roact, { PropsWithChildren } from "@rbxts/roact";
import { RunService } from "@rbxts/services";
import { ActiveStates, ObjectType, RowindClassEngine } from "../engine";

enum ApplyUpdate {
	Hover = "hover",
	Focus = "focus",
	Selected = "selected",
}

function changeActive(states: ActiveStates, transitionTicks: number, active: ApplyUpdate[]) {
	const tt2 = transitionTicks * 2;
	if (active.includes(ApplyUpdate.Focus)) {
		// TODO: Apply transition delay.
		states.focus = math.min(math.floor(math.max(states.focus + 1 / transitionTicks, 0) * tt2) / tt2, 1);
	} else {
		states.focus = math.min(math.floor(math.max(states.focus - 1 / transitionTicks, 0) * tt2) / tt2, 1);
	}
	if (active.includes(ApplyUpdate.Selected)) {
		// TODO: Apply transition delay.
		states.selected = math.min(math.floor(math.max(states.selected + 1 / transitionTicks, 0) * tt2) / tt2, 1);
	} else {
		states.selected = math.min(math.floor(math.max(states.selected - 1 / transitionTicks, 0) * tt2) / tt2, 1);
	}
	if (active.includes(ApplyUpdate.Hover)) {
		// TODO: Apply transition delay.
		states.hover = math.min(math.floor(math.max(states.hover + 1 / transitionTicks, 0) * tt2) / tt2, 1);
	} else {
		states.hover = math.min(math.floor(math.max(states.hover - 1 / transitionTicks, 0) * tt2) / tt2, 1);
	}
}

export enum FXType {
	Animate_ClassBased,
	Animate_ProcessorBased,
	Processor,
	Loop_ClassBased,
	Loop_ProcessorBased,
}

export interface IEffect {
	fxType: FXType;
	processor?: (props: { [key: string]: unknown }) => { [key: string]: unknown };
	frameBorrow?: number;
	className?: string;
}

interface RowindComponentProps<T extends ObjectType> {
	flavour: T;
	Text?: string;
	Image?: string;
	className: string;
	Name: string | number;
	Effects: IEffect[];
}

let nextAvailable = 0;
const stateForNamedComponent = new Map<string | number, ActiveStates>();

class WorseRowindComponent<T extends ObjectType> extends Roact.Component<
	PropsWithEventsAndChildren<RowindComponentProps<T>>,
	{}
> {
	protected neededFrames = 0;

	private animationLength = 10;
	private myStateKey: string | number;
	private classNameForEffects?: string;
	private alphaForEffects?: number;
	private maxEffectAlpha?: number;
	private preApplyProcessors: ((props: { [key: string]: unknown }) => { [key: string]: unknown })[] = [];

	constructor(
		props: { flavour: T; state_key?: number | string } & PropsWithEventsAndChildren<RowindComponentProps<T>>,
	) {
		super(props);

		this.myStateKey = props.state_key ?? ++nextAvailable;

		stateForNamedComponent.set(
			this.myStateKey,
			stateForNamedComponent.get(this.myStateKey) ?? {
				hover: 0,
				focus: 0,
				selected: 0,
				dark: 1,
				light: 0,
				motion: 0,
				colorblind: 0,
			},
		);
	}

	public getActiveState() {
		return stateForNamedComponent.get(this.myStateKey)!;
	}

	public render(): Roact.Element | undefined {
		for (const effect of this.props.Effects) {
			switch (effect.fxType) {
				case FXType.Animate_ClassBased:
					this.classNameForEffects = effect.className!;
					effect.frameBorrow = effect.frameBorrow! - 1;
					this.maxEffectAlpha = math.max(effect.frameBorrow, this.maxEffectAlpha ?? 0);
					this.alphaForEffects = effect.frameBorrow;
					this.setTransition(effect.frameBorrow!);
					break;
				case FXType.Animate_ProcessorBased:
					effect.frameBorrow = effect.frameBorrow! - 1;
					this.maxEffectAlpha = math.max(effect.frameBorrow, this.maxEffectAlpha ?? 0);
					this.alphaForEffects = effect.frameBorrow;
					this.preApplyProcessors.push(effect.processor!);
					this.setTransition(effect.frameBorrow!);
					break;
				case FXType.Processor:
					this.preApplyProcessors.push(effect.processor!);
					this;
			}
		}

		const v = RowindClassEngine.gatherProperties(
			this.props.className,
			this.props.flavour,
			this.getActiveState(),
			this.classNameForEffects ?? "",
			1 - (this.alphaForEffects ?? 0) / (this.maxEffectAlpha ?? 1),
		);

		for (const processor of this.preApplyProcessors) {
			v.Data = processor(v.Data) ?? v.Data;
		}

		this.animationLength = (v.UnprocessedData.data["animation-length"] as number) ?? 10;

		switch (this.props.flavour) {
			case ObjectType.Div:
				return (
					<frame
						Key={this.props.Name}
						Active={true}
						{...v.Data}
						Event={{
							MouseEnter: () => this.setActive(ApplyUpdate.Hover, this.animationLength),
							MouseLeave: () => this.setInactive(ApplyUpdate.Hover, this.animationLength),
							InputBegan: (_, input) => {
								if (input.UserInputType === Enum.UserInputType.MouseButton1) {
									this.setActive(ApplyUpdate.Focus, this.animationLength);
									try {
										this.props.mouseDown?.(input);
									} catch (e) {
										warn(e);
									}
									if (this.props.mouseUp) {
										let myConnection: RBXScriptConnection;
										myConnection = (input.Changed as RBXScriptSignal<() => void>).Connect(() => {
											this.props.mouseUp?.(input);
											this.setInactive(ApplyUpdate.Focus, this.animationLength);

											myConnection.Disconnect();
										});
									}
								}
							},
							InputEnded: (_, input) => {
								if (input.UserInputType === Enum.UserInputType.MouseButton1) {
									this.setInactive(ApplyUpdate.Focus, this.animationLength);

									this.props.mouseUp?.(input);
								}
							},
						}}
					>
						{v.Children}
						{this.props[Roact.Children]}
					</frame>
				);
			case ObjectType.Span:
				return (
					<textlabel
						Key={this.props.Name}
						Active={true}
						{...v.Data}
						Event={{
							MouseEnter: () => this.setActive(ApplyUpdate.Hover, this.animationLength),
							MouseLeave: () => this.setInactive(ApplyUpdate.Hover, this.animationLength),
							InputBegan: (_, input) => {
								if (input.UserInputType === Enum.UserInputType.MouseButton1) {
									this.setActive(ApplyUpdate.Focus, this.animationLength);
									try {
										this.props.mouseDown?.(input);
									} catch (e) {
										warn(e);
									}
									if (this.props.mouseUp) {
										let myConnection: RBXScriptConnection;
										myConnection = (input.Changed as RBXScriptSignal<() => void>).Connect(() => {
											this.props.mouseUp?.(input);
											this.setInactive(ApplyUpdate.Focus, this.animationLength);

											myConnection.Disconnect();
										});
									}
								}
							},
							InputEnded: (_, input) => {
								if (input.UserInputType === Enum.UserInputType.MouseButton1) {
									this.setInactive(ApplyUpdate.Focus, this.animationLength);

									this.props.mouseUp?.(input);
								}
							},
						}}
						Text={this.props.Text ?? ""}
					>
						{v.Children}
						{this.props[Roact.Children]}
					</textlabel>
				);
			case ObjectType.Button:
				if (!this.props.Image) {
					return (
						<textbutton
							Key={this.props.Name}
							Active={true}
							AutoButtonColor={false}
							{...v.Data}
							Event={{
								MouseEnter: () => this.setActive(ApplyUpdate.Hover, this.animationLength),
								MouseLeave: () => this.setInactive(ApplyUpdate.Hover, this.animationLength),
								MouseButton1Down: (_, input) => {
									try {
										this.props.mouseDown?.(undefined!);
									} catch (e) {
										warn(e);
									}

									this.setActive(ApplyUpdate.Focus, this.animationLength);
								},
								MouseButton1Up: (_, input) => {
									try {
										this.props.mouseUp?.(undefined!);
									} catch (e) {
										warn(e);
									}

									this.setInactive(ApplyUpdate.Focus, this.animationLength);
								},
							}}
							Text={this.props.Text ?? ""}
						>
							{v.Children}
							{this.props[Roact.Children]}
						</textbutton>
					);
				} else {
					return (
						<imagebutton
							Key={this.props.Name}
							Active={true}
							AutoButtonColor={false}
							{...v.Data}
							Event={{
								MouseEnter: () => this.setActive(ApplyUpdate.Hover, this.animationLength),
								MouseLeave: () => this.setInactive(ApplyUpdate.Hover, this.animationLength),
								MouseButton1Down: (_, input) => {
									try {
										this.props.mouseDown?.(undefined!);
									} catch (e) {
										warn(e);
									}

									this.setActive(ApplyUpdate.Focus, this.animationLength);
								},
								MouseButton1Up: (_, input) => {
									try {
										this.props.mouseUp?.(undefined!);
									} catch (e) {
										warn(e);
									}

									this.setInactive(ApplyUpdate.Focus, this.animationLength);
								},
							}}
							Image={this.props.Image ?? ""}
						>
							{v.Children}
							{this.props[Roact.Children]}
						</imagebutton>
					);
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
		this.ticks = math.max(ticks, this.ticks);
	}

	public didMount(): void {
		this.startTransitions();
	}

	public connection?: RBXScriptConnection;
	public startTransitions() {
		this.connection = RunService.RenderStepped.Connect(() => {
			if (this.ticks >= 0) {
				this.handleStates();
				this.ticks -= 1;
			}

			if (this.alphaForEffects && this.alphaForEffects >= 0) {
				this.setState({});
			}
		});
	}

	public willUnmount(): void {
		this.connection?.Disconnect();
	}

	public handleStates() {
		changeActive(this.getActiveState(), this.animationLength, this.activeUpdates);
		this.setState(this.state);
	}
}

// Button,
// Input,
// Div,
// Span,

type PropsWithEventsAndChildren<X> = PropsWithChildren<X> & {
	mouseDown?: (input: InputObject) => void;
	mouseUp?: (input: InputObject) => void;
	Key?: string | number;
	Effects?: IEffect[];
};

let _counter = 0;

export function Div(props: PropsWithEventsAndChildren<{ className: string; Id?: string | number }>) {
	return (
		<WorseRowindComponent
			Name={props.Key ?? _counter++}
			mouseUp={props.mouseUp}
			mouseDown={props.mouseDown}
			flavour={ObjectType.Div}
			className={props.className}
			state_key={props.Id}
			Effects={props.Effects ?? []}
		>
			{props[Roact.Children]}
		</WorseRowindComponent>
	);
}

export function Span(props: PropsWithEventsAndChildren<{ className: string; Id?: string | number; Text: string }>) {
	return (
		<WorseRowindComponent
			Name={props.Key ?? _counter++}
			mouseUp={props.mouseUp}
			mouseDown={props.mouseDown}
			flavour={ObjectType.Span}
			className={props.className}
			Text={props.Text}
			state_key={props.Id}
			Effects={props.Effects ?? []}
		>
			{props[Roact.Children]}
		</WorseRowindComponent>
	);
}

export function Button(
	props: PropsWithEventsAndChildren<{ className: string; Id?: string | number; Text?: string; Image?: string }>,
) {
	return (
		<WorseRowindComponent
			Name={props.Key ?? _counter++}
			mouseUp={props.mouseUp}
			mouseDown={props.mouseDown}
			flavour={ObjectType.Button}
			className={props.className}
			Text={props.Text}
			Image={props.Image}
			state_key={props.Id}
			Effects={props.Effects ?? []}
		>
			{props[Roact.Children]}
		</WorseRowindComponent>
	);
}
