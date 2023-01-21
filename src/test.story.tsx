import Roact from "@rbxts/roact"
import { CrappyButton, CrappyDiv } from ".";

export = function(target: Instance) {
    let tree = Roact.mount(
        <CrappyButton 
            className="w-20 hover:w-40 h-20 hover:h-25 bg-red-200 rounded-md hover:rounded-xl hover:bg-rose-300 border-4 border-white"
        />,
        target,
        "UI"
    );

    return function() {
        Roact.unmount(tree);
    }
}