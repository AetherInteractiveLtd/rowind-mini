import Roact from "@rbxts/roact";

interface BaseElementProperties {
    v: string;
}

interface B extends BaseElementProperties {

}

export class BaseElement<T = BaseElementProperties> extends Roact.Component<T> {
    public render(): Roact.Element {
        this.props[Roact.Children]
        return <frame></frame>
    }
}