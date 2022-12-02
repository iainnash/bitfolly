import {basicSetup} from "codemirror"
import {EditorView, keymap} from "@codemirror/view"
import {defaultKeymap} from "@codemirror/commands"
import {javascript} from "@codemirror/lang-javascript"


const canvas = document.getElementById("canvas");
canvas.width = Math.floor(window.innerWidth);
canvas.height = Math.floor(window.innerHeight);
const ctx = canvas.getContext("2d");

const gpu = new GPU();
let kernel;
function evalCode(view) {
  const code = view.state.doc.toString();
  //(x|y)%200
  const codeFn = Function(`
    let x = this.thread.x;
    let y = this.thread.y;
    return ${code};
  `);
  const width = canvas.width;
  const height = canvas.height;
  const kernel = gpu.createKernel(codeFn).setOutput([width, height]);
  const outputBufferRaw = kernel();
  const outputBuffer = new Uint8ClampedArray(width*height*4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width*4; x++) {
      outputBuffer[x*4+y*width*4] = outputBufferRaw[y][x];
      outputBuffer[x*4+y*width*4+1] = outputBufferRaw[y][x];
      outputBuffer[x*4+y*width*4+2] = outputBufferRaw[y][x];
      outputBuffer[x*4+y*width*4+3] = 255;
    }
  }
  const output = new ImageData(outputBuffer, width, height);
  ctx.putImageData(output, 0, 0);
  return true;
}

const editorDiv = document.getElementById("editor")
const editor = new EditorView({
  extensions: [
    keymap.of([{
      key: "Ctrl-Enter",
      run: evalCode,
    }]),
    keymap.of(defaultKeymap),
    javascript(),
    basicSetup,
  ],
  parent: editorDiv,
});