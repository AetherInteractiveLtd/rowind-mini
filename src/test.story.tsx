import Roact from "@rbxts/roact";
import { Button, Div, FXType, Span } from "./components";

import "./classes/span"; // Needed to register all the classes.
import { RunService, TextService, UserInputService, Workspace } from "@rbxts/services";

function getTimeString() {
	return os.date("%X.") + string.format(`%d`, os.time() % 1000);
}

const RESERVED_COLORS = {
	TINA: "rgb(79,171,222)",
};

const LEVEL_COLORS = {
	[0]: "rgb(255,255,255)",
	[1]: "rgb(255,150,0)",
	[2]: "rgb(255,110,200)",
	[3]: "rgb(255,10,10)",
};

const FUNCTIONAL_LEVEL_COLORS = {
	[0]: [false, undefined],
	[1]: [true, "orange-500"],
	[2]: [true, "pink-400"],
	[3]: [true, "rose-600"],
};

function writeFormat(level: 0 | 1 | 2 | 3, scope: string, message: string) {
	return (
		`<font color="rgb(170,170,170)">${getTimeString()}</font> - <font color="rgb(180,180,180)">[` +
		`</font><b><font color="${
			RESERVED_COLORS[scope as keyof typeof RESERVED_COLORS] ?? "rgb(255,125,0)"
		}">${scope}</font></b>` +
		`<font color="rgb(180,180,180)">]</font> <font color="${LEVEL_COLORS[level]}">${message}</font>`
	);
}

function getBounds(text: string, font: Font, size: number, width: number) {
	const params = new Instance("GetTextBoundsParams");
	params.Text = text;
	params.Font = font;
	params.Size = size;
	params.Width = width;

	const bounds = TextService.GetTextBoundsAsync(params);

	return bounds;
}

class Console extends Roact.Component<{}, {}> {
	isResizing = false;

	portionOfScreen = 100;

	public render(): Roact.Element {
		return (
			<Div
				Effects={[
					{
						fxType: FXType.Animate_ClassBased,
						className: "offset-5%",
						frameBorrow: 80,
					},
				]}
				className="flex-center-center offset-10% cellw-100% cellh-10% w-100% h-100% maxlinesize-5 bg-transparent"
			>
				<Div className=""></Div>
				<Div className=""></Div>
			</Div>
		);
	}
	protected didMount(): void {}

	protected willUnmount(): void {}
}

export = function (target: Instance) {
	const tree = Roact.mount(<Console />, target, "UI");

	return function () {
		Roact.unmount(tree);
	};
};
