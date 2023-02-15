import Roact from "@rbxts/roact";
import { Button, Div, Span } from "./components";

import './classes/span'; // Needed to register all the classes.
import { RunService, TextService, UserInputService, Workspace } from "@rbxts/services";

function getTimeString() {
    return os.date("%X.") + string.format(`%d`, os.time() % 1000);
}

let RESERVED_COLORS = {
    TINA: "rgb(79,171,222)"
}

const LEVEL_COLORS = {
    [0]: "rgb(255,255,255)",
    [1]: "rgb(255,150,0)",
    [2]: "rgb(255,110,200)",
    [3]: "rgb(255,10,10)"
}

const FUNCTIONAL_LEVEL_COLORS = {
    [0]: [false, undefined],
    [1]: [true, "orange-500"],
    [2]: [true, "pink-400"],
    [3]: [true, "rose-600"]
}

function writeFormat(level: 0 | 1 | 2 | 3, scope: string, message: string) {
    return (
        `<font color="rgb(170,170,170)">${getTimeString()}</font> - <font color="rgb(180,180,180)">[`
        +`</font><b><font color="${RESERVED_COLORS[scope as keyof typeof RESERVED_COLORS] ?? 'rgb(255,125,0)'}">${scope}</font></b>`
        +`<font color="rgb(180,180,180)">]</font> <font color="${LEVEL_COLORS[level]}">${message}</font>`
    )
}

function getBounds(text: string, font: Font, size: number, width: number) {
    let params = new Instance("GetTextBoundsParams");
    params.Text = text;
    params.Font = font;
    params.Size = size;
    params.Width = width;

    let bounds = TextService.GetTextBoundsAsync(params);

    return bounds;
}

class Console extends Roact.Component<{}, {}> {
    isResizing = false;

    portionOfScreen = 100;

    public render(): Roact.Element {
        let flareData: string[] = ["B", "Beans", "Woop Woop Fuckers"];
        let consoleMessages: ([0 | 1 | 2 | 3, string, string])[] = [
            [ 1, writeFormat(1, "CORE", "Starting in safe mode..."), "game.ReplicatedStorage.Main.Core.index:200:12" ],
            [ 0, writeFormat(0, "TINA", "Initializing Tina!"), "game.ReplicatedStorage.rbxts_include.Tina.TinaCore:19:12" ],
            [ 2, writeFormat(2, `CORE<font color="rgb(180,180,180)">/</font>NPC`, "'Greg' ready to interact"), "game.ReplicatedStorage.Main.Core.index:200:12" ],
            [ 2, writeFormat(2, "CORE/NPC", "'Anabeth' ready to interact"), "game.ReplicatedStorage.Main.Core.index:200:12" ]
        ];

        let v;

        return <Div className={`anchor-0-1 y-100% w-100% h-${(this.portionOfScreen * 0.01 * (Workspace.CurrentCamera?.ViewportSize.Y ?? 0)) > 30 ? this.portionOfScreen + "%" : "30"} bg-transparent`}>
            <Div Key="ConsoleFeed" className="w-100% bg-slate-800 h-100% h--30px bg-0.2 y-30px flex-left-bottom padding-4 clip">
                {consoleMessages.map(x => {
                    if (typeIs(x, "table")) {
                        return <Div className="w-100% h-19px bg-transparent">
                            <Span Text={x[1]} className={`w-100% h-100% text-18 text-RobotoMono text-white bg-0.8 bg-${FUNCTIONAL_LEVEL_COLORS[x[0]][1] ?? 'transparent'} richtext`}></Span>
                            <Span Text={x[2]} className={`w-100% h-100% anchor-1-0 x-100% text-18 text-Sono text-gray-300 bg-transparent richtext align-right`}></Span>
                        </Div>
                    } else {
                        return <Span Text={x} className="w-100% h-19px text-18 text-RobotoMono text-white bg-transparent richtext"></Span>
                    }
                })}
            </Div>
            <Div
                Key="FlareStore"
                className="w-100% bg-gray-900 padding-2-0-0-0 border-0 h-30px"
                mouseDown={(input: InputObject & Instance) => {
                    this.isResizing = true;
                }}
                mouseUp={(input) => {
                    this.isResizing = false;
                }}
            >
                <Div className="w-100% h-100% bg-transparent flex-left-center offset-4 direction-horizontal">
                    {flareData.map(x =>
                        <Div className={`w-${getBounds(x, Font.fromId(12187374537), 16, 2000).X + 53} bg-gray-800 h-24px text-10 rounded-10`}>
                            <Div className="w-18px h-18px x-3 y-3 bg-red-200 rounded-11" />
                            <Span Text={x} className={`bg-transparent text-white text-16 h-22px w-75 x-26px text-Sono`}/>
                            <Span Text={"x1"} className="text-gray-200 anchor-1-0 w-20 h-20 y-2 x-100% text-Code bg-transparent text-14 text-right" />
                        </Div>
                    )}
                </Div>
                <Button Key={"IAmYourButton"} className="w-20 h-20 bg-red-100 anchor-0-0 x-50% y-10 text-white text-20" Text="X"></Button>
            </Div>

        </Div>
    }

    connection?: RBXScriptConnection;
    protected didMount(): void {
        this.connection = RunService.PreRender.Connect(() => {
            if (this.isResizing) {
                this.portionOfScreen = 100 - (UserInputService.GetMouseLocation().Y / Workspace.CurrentCamera!.ViewportSize.Y * 100);
                this.setState({});
            }
        });
    }

    protected willUnmount(): void {
        this.connection?.Disconnect()
    }
}

export = function(target: Instance) {
    let tree = Roact.mount(
        <Console />,
        target,
        "UI"
    );

    return function() {
        Roact.unmount(tree);
    }
}