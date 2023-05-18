/* eslint-disable roblox-ts/lua-truthiness */
/* eslint-disable prefer-const */
import Roact, { Element, Portal, PropsWithChildren } from "@rbxts/roact";
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

type PropsWithEventsAndChildren<X, I extends GuiObject> = PropsWithChildren<X> & {
	mouseDown?: (input: InputObject) => void;
	mouseUp?: (input: InputObject) => void;
	Key?: string | number;
	className: string;
	Effects?: IEffect[];
	Props?: Partial<JSX.IntrinsicElement<I>>;
	Events?: Partial<Roact.JsxInstanceEvents<I>>;
};

interface RowindComponentProps<I extends GuiObject> {
	flavour: ObjectType;
	Text?: string;
	Image?: string;
	Effects: IEffect[];
	Events: Partial<Roact.JsxInstanceEvents<I>>;
}

let stateKeyGlobal = 0;

const stateForNamedComponent = new Map<string | number, ActiveStates>();

class WorseRowindComponent<I extends GuiObject> extends Roact.Component<
	PropsWithEventsAndChildren<RowindComponentProps<I>, I>,
	{}
> {
	protected neededFrames = 0;

	private animationLength = 10;
	private classNameForEffects?: string;
	private alphaForEffects?: number;
	private maxEffectAlpha?: number;
	private preApplyProcessors: ((props: { [key: string]: unknown }) => { [key: string]: unknown })[] = [];

	private stateKey: string;

	private roactEvents: Roact.JsxInstanceEvents<I> = {};

	constructor(props: PropsWithEventsAndChildren<RowindComponentProps<I>, I>) {
		super(props);

		this.stateKey = tostring(props.Key ?? stateKeyGlobal++);

		stateForNamedComponent.set(
			this.stateKey,
			stateForNamedComponent.get(this.stateKey) ?? {
				hover: 0,
				focus: 0,
				selected: 0,
				dark: 1,
				light: 0,
				motion: 0,
				colorblind: 0,
			},
		);

		this.hookFrameEvents();
	}

	private hookFrameEvents() {
		const events = this.props.Events as Roact.JsxInstanceEvents<GuiObject>;
		const roactEvents = table.clone(events) as Roact.JsxInstanceEvents<GuiObject>;

		const mouseEnterSupplied = events.MouseEnter;
		const mouseLeaveSupplied = events.MouseLeave;
		const inputBeganSupplied = events.InputBegan;
		const inputEndedSupplied = events.InputEnded;

		roactEvents.MouseEnter = (...args) => {
			this.setActive(ApplyUpdate.Hover, this.animationLength);
			mouseEnterSupplied?.(...args);
		};
		roactEvents.MouseLeave = (...args) => {
			this.setInactive(ApplyUpdate.Hover, this.animationLength);
			mouseLeaveSupplied?.(...args);
		};
		roactEvents.InputBegan = (...args) => {
			if (args[1].UserInputType === Enum.UserInputType.MouseButton1) {
				this.setActive(ApplyUpdate.Focus, this.animationLength);
				try {
					this.props.mouseDown?.(args[1]);
				} catch (e) {
					warn(e);
				}
			}
			inputBeganSupplied?.(...args);
		};
		roactEvents.InputEnded = (...args) => {
			if (args[1].UserInputType === Enum.UserInputType.MouseButton1) {
				this.setInactive(ApplyUpdate.Focus, this.animationLength);
				try {
					this.props.mouseUp?.(args[1]);
				} catch (e) {
					warn(e);
				}
			}
			inputEndedSupplied?.(...args);
		};
	}

	public getActiveState() {
		return stateForNamedComponent.get(this.stateKey)!;
	}

	public didUpdate(previousProps: PropsWithEventsAndChildren<RowindComponentProps<I>, I>, previousState: {}): void {
		this.hookFrameEvents();
	}

	public render(): Roact.Element | undefined {
		for (const effect of this.props.Effects) {
			switch (effect.fxType) {
				case FXType.Animate_ClassBased:
					this.classNameForEffects = effect.className!;
					effect.frameBorrow = math.max(0, effect.frameBorrow! - 1);
					this.maxEffectAlpha = math.max(effect.frameBorrow, this.maxEffectAlpha ?? 0);
					this.alphaForEffects = effect.frameBorrow;
					this.setTransition(effect.frameBorrow!);
					break;
				case FXType.Animate_ProcessorBased:
					effect.frameBorrow = math.max(0, effect.frameBorrow! - 1);
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

		const children = new Map<string | number, Roact.Element>();
		let childIndex = 0;

		const attributes: { [index: string | symbol]: unknown } & { AutoButtonColor?: boolean } = {
			Active: true,
			Text: this.props.Text,
			Image: this.props.Image,
			AutoButtonColor: undefined,

			...v.Data,
			...this.props.Props,

			[Roact.Children]: children,
		};

		for (const [event, callback] of pairs(this.roactEvents as Record<string, (...args: unknown[]) => void>)) {
			attributes[Roact.Event[event]] = callback;
		}

		for (const element of v.Children) {
			children.set(childIndex++, element);
		}

		this.props[Roact.Children]?.forEach((element, key) => {
			children.set(key, element);
		});

		let instanceClass: keyof CreatableInstances;

		switch (this.props.flavour) {
			case ObjectType.Div: {
				instanceClass = "Frame";
				break;
			}
			case ObjectType.CanvasDiv: {
				instanceClass = "CanvasGroup";
				break;
			}
			case ObjectType.Span: {
				instanceClass = "TextLabel";
				attributes.Text ??= " ";
				break;
			}
			case ObjectType.Button: {
				attributes.AutoButtonColor = false;

				if (this.props.Image) {
					instanceClass = "ImageButton";
				} else {
					instanceClass = "TextButton";
					attributes.Text ??= " ";
				}

				break;
			}
			default: {
				return <></>;
			}
		}

		if (this.props.Key) {
			return Roact.createFragment({
				[this.props.Key]: Roact.createElement(instanceClass, attributes as never),
			});
		} else {
			return Roact.createElement(instanceClass, attributes as never);
		}
	}

	// private mouseDown(input: InputObject) {
	// 	if (input.UserInputType !== Enum.UserInputType.MouseButton1)
	// 		try {
	// 			this.props.mouseDown?.(input);
	// 		} catch (e) {
	// 			warn(e);
	// 		}
	// }

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

export function Div(props: PropsWithEventsAndChildren<{}, Frame>) {
	const attributes = props as PropsWithEventsAndChildren<RowindComponentProps<Frame>, Frame>;
	attributes.Effects ??= [];
	attributes.Events ??= {};
	attributes.Props ??= {};
	attributes.flavour = ObjectType.Div;

	// TODO: Do I even have to explain what's wrong here.
	// For bug explanation see https://discord.com/channels/476080952636997633/1107669273020739594
	if (props.Key) {
		return Roact.createFragment({
			[props.Key]: Roact.createElement(WorseRowindComponent as never, props),
		});
	} else {
		return Roact.createElement(WorseRowindComponent as never, props);
	}
}

export function CanvasDiv(props: PropsWithEventsAndChildren<{}, CanvasGroup>) {
	const attributes = props as PropsWithEventsAndChildren<RowindComponentProps<CanvasGroup>, CanvasGroup>;
	attributes.Effects ??= [];
	attributes.Events ??= {};
	attributes.Props ??= {};
	attributes.flavour = ObjectType.CanvasDiv;

	// TODO: Do I even have to explain what's wrong here.
	// For bug explanation see https://discord.com/channels/476080952636997633/1107669273020739594
	if (props.Key) {
		return Roact.createFragment({
			[props.Key]: Roact.createElement(WorseRowindComponent as never, props),
		});
	} else {
		return Roact.createElement(WorseRowindComponent as never, props);
	}
}

export function Span(props: PropsWithEventsAndChildren<{ Text: string }, TextLabel>) {
	const attributes = props as PropsWithEventsAndChildren<RowindComponentProps<TextLabel>, TextLabel>;
	attributes.Effects ??= [];
	attributes.Events ??= {};
	attributes.Props ??= {};
	attributes.flavour = ObjectType.Span;

	// TODO: Do I even have to explain what's wrong here.
	// For bug explanation see https://discord.com/channels/476080952636997633/1107669273020739594
	if (props.Key) {
		return Roact.createFragment({
			[props.Key]: Roact.createElement(WorseRowindComponent as never, props),
		});
	} else {
		return Roact.createElement(WorseRowindComponent as never, props);
	}
}

export function Button(props: PropsWithEventsAndChildren<{ Text?: string; Image?: string }, TextButton | ImageButton>) {
	const attributes = props as PropsWithEventsAndChildren<
		RowindComponentProps<TextButton | ImageButton>,
		TextButton | ImageButton
	>;
	attributes.Effects ??= [];
	attributes.Events ??= {};
	attributes.Props ??= {};
	attributes.flavour = ObjectType.Button;

	// TODO: Do I even have to explain what's wrong here.
	// For bug explanation see https://discord.com/channels/476080952636997633/1107669273020739594
	if (props.Key) {
		return Roact.createFragment({
			[props.Key]: Roact.createElement(WorseRowindComponent as never, props),
		});
	} else {
		return Roact.createElement(WorseRowindComponent as never, props);
	}
}
