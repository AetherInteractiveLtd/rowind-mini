import { FXType, IEffect } from "../components";

export class Anim implements IEffect {
	public fxType: FXType = FXType.Animate_ClassBased;
	public frameBorrow?: number | undefined;

	constructor(public className: string, frames: number) {
		this.frameBorrow = frames;
	}
}
