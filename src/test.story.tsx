import Roact from "@rbxts/roact";
import { Div, Span } from "./components";

import './classes/span'; // Needed to register all the classes.

export = function(target: Instance) {
    // w-50 h-50 hover:h-60 hover:w-60 rounded-10 hover:rounded-13 bg-red-200 hover:bg-rose-300 animation-8 border-white border-2 hover:border-3
    let val = "w-50% h-50 hover:h-60 hover:w-55% bg-red-200 hover:bg-rose-300 rounded-10 hover:rounded-13 animation-9 border-white border-2 hover:border-8"

    let tree = Roact.mount(
        <Div className="flex-center w-100% h-100% bg-transparent offset-20">
            <Span Text={val} className="w-100% h-70 bg-transparent text-white text-Code text-14" />
            <Div className={val}/>
        </Div>,
        target,
        "UI"
    );

    return function() {
        Roact.unmount(tree);
    }
}