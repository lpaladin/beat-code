import * as vscode from "vscode";
import { commands, contexts, cursorCommands, directionList, joinCSS, move, random, Direction } from "./util";
import { gsap } from "gsap";

class Decorator {
    private _progress: number = 0;
    private _lastDecorationType: vscode.TextEditorDecorationType | undefined;
    private _charRange: [vscode.Range];
    private _char: string;
    private _gradient: string;

    private get _randomByte(): number {
        return Math.floor(Math.random() * 256);
    }

    public constructor(private _editor: vscode.TextEditor, public position: vscode.Position) {
        this._charRange = [new vscode.Range(position, position.with(position.line, position.character + 1))];
        this._char = _editor.document.getText(this._charRange[0]);
        this._gradient = `linear-gradient(to bottom, rgb(${this._randomByte}, ${this._randomByte}, ${this._randomByte}), rgb(${this._randomByte}, ${this._randomByte}, ${this._randomByte}))`;
    }

    public dispose() {
        this._lastDecorationType?.dispose();
    }

    public get ready(): boolean {
        return this.progress > 1 - 1e-6;
    }

    public get progress(): number {
        return this._progress;
    }

    public set progress(to: number) {
        this._progress = to;
        let decoration: vscode.TextEditorDecorationType;
        if (to > 1) {
            decoration = vscode.window.createTextEditorDecorationType({
                before: {
                    contentText: this._char,
                    textDecoration: `none; ${joinCSS({
                        display: "inline-block",
                        position: "absolute",
                        color: "transparent",
                        borderWidth: "0.2ch",
                        borderStyle: "solid",
                        borderImage: this._gradient,
                        borderImageSlice: "1%",
                        pointerEvents: "none",
                        transform: `scale(${to})`,
                        opacity: `${(2 - to) * 100}%`,
                        zIndex: "0",
                    })}`,
                },
                textDecoration: `none; ${joinCSS({
                    position: "relative",
                    zIndex: "1",
                })}`,
                rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            });
        } else {
            decoration = vscode.window.createTextEditorDecorationType({
                before: {
                    contentText: this._char,
                    textDecoration: `none; ${joinCSS({
                        display: "inline-block",
                        position: "absolute",
                        color: "transparent",
                        backgroundImage: this._gradient,
                        pointerEvents: "none",
                        transform: `scale(${2 - to})`,
                        opacity: `${to * 100}%`,
                        zIndex: "0",
                    })}`,
                },
                textDecoration: `none; ${joinCSS({
                    position: "relative",
                    zIndex: "1",
                })}`,
                rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            });
        }
        this._editor.setDecorations(decoration, this._charRange);
        this._lastDecorationType?.dispose();
        this._lastDecorationType = decoration;
    }
}

class Step {
    public constructor(public decorator: Decorator, public direction: Direction) {}
}

class Game {
    tl: gsap.core.Timeline | undefined = undefined;
    usedPositions: Set<string> = new Set();
    steps: Step[] = [];

    public build() {
        this.tl = gsap.timeline();
        if (vscode.window.activeTextEditor) {
            let lastPosition = vscode.window.activeTextEditor.selection.active;
            for (let i = 0; i < 10; i++) {
                const d = random(directionList);
                const [l, c] = move([lastPosition.line, lastPosition.character], d);
                const positionKey = `${l}-${c}`;
                if (l < 0 || this.usedPositions.has(positionKey)) {
                    i--;
                    continue;
                }
                this.usedPositions.add(positionKey);
                lastPosition = new vscode.Position(l, c);
                const decorator = new Decorator(vscode.window.activeTextEditor, lastPosition);
                this.tl.fromTo(
                    decorator,
                    { progress: 0 },
                    {
                        progress: 1,
                        duration: 1,
                    },
                    i * 0.5
                );
                this.steps.push(new Step(decorator, d));
            }
        }
    }

    public consume(d: Direction): gsap.core.Tween | undefined {
        const next = this.steps[0];
        if (next && next.decorator.ready && next.direction === d) {
            this.steps.shift();
            const positionKey = `${next.decorator.position.line}-${next.decorator.position.character}`;
            this.usedPositions.delete(positionKey);
            return gsap.fromTo(
                next.decorator,
                { progress: 1 },
                {
                    progress: 2,
                    duration: 0.5,
                    onComplete() {
                        next.decorator.dispose();
                    },
                }
            );
        }
    }

    public clear() {
        for (const step of this.steps) {
            step.decorator.dispose();
        }
        this.steps.length = 0;
    }
}

export function activate(context: vscode.ExtensionContext) {
    const game = new Game();

    context.subscriptions.push(
        vscode.commands.registerCommand(commands.activate, () => {
            vscode.window.showInformationMessage("Let's BEAT!");
            vscode.commands.executeCommand("setContext", contexts.activated, true);
            game.build();
            console.log(game.steps.map((s) => s.direction).join(" "));
        })
    );
    context.subscriptions.push(
        ...directionList.map((d) =>
            vscode.commands.registerCommand(commands[d], () => {
                if (game.consume(d)) {
                    vscode.commands.executeCommand(cursorCommands[d]);
                }
            })
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(commands.deactivate, () => {
            game.clear();
            vscode.commands.executeCommand("setContext", contexts.activated, false);
            vscode.window.showInformationMessage("Beat stopped.");
        })
    );
}

// This method is called when your extension is deactivated
export function deactivate() {}
