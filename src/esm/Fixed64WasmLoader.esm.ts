// Fixed64WasmLoader.ts
import path, { dirname, join } from 'path';
import MainModuleFactory from '../../dist/esm/Fixed64Native.js';

let __dirname = dirname(new URL(import.meta.url).pathname);

export let Fixed64Module: any;
export let interopParamArrayAddress: number;
export let interopParamUint32ArrayAddress: number;
export let interopReturnArrayAddress: number;
export let interopReturnUint32ArrayAddress: number;
export let sizeOfFixed64Param: number;
export let fixed64ParamOffsets: any;

async function loadWasmFile(): Promise<Uint8Array> {
    if (typeof window !== 'undefined') {
        console.log("Loading WASM from URL");
        const response = await fetch(new URL('./Fixed64Native.wasm', window.location.href));
        return new Uint8Array(await response.arrayBuffer());
    } else if (typeof process !== 'undefined') {
        console.log("Loading WASM from filesystem");
        const fs = (await import('fs/promises')).default;
        if (process.platform === "win32") {
            // https://stackoverflow.com/questions/64132284/in-windows-node-js-path-join-prepends-the-current-working-directorys-drive
            __dirname = __dirname.replace(/^\/([a-zA-Z]:)/, '$1');
        }
        const wasmPath = path.join(__dirname, './Fixed64Native.wasm');
        return fs.readFile(wasmPath);
    }
    throw new Error('Unsupported environment');
}

export async function loadFixed64Wasm(): Promise<any> {
    if (!Fixed64Module) {
        const wasmData = await loadWasmFile();
        Fixed64Module = await initWasm(MainModuleFactory, wasmData);
        interopParamArrayAddress = Fixed64Module.getInteropParamArrayAddress();
        interopParamUint32ArrayAddress = Fixed64Module.getInteropUint32ParamArrayAddress();
        interopReturnArrayAddress = Fixed64Module.getInteropReturnArrayAddress();
        interopReturnUint32ArrayAddress = Fixed64Module.getInteropReturnUint32ArrayAddress();
        sizeOfFixed64Param = Fixed64Module.getSizeOfFixed64Param();
        fixed64ParamOffsets = Fixed64Module.getFixed64ParamOffsets();
    }
    return Fixed64Module;
}

function initWasm(wasmFactory: any, wasmData: Uint8Array): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        wasmFactory({
            instantiateWasm(importObject: WebAssembly.Imports, receiveInstance: (instance: WebAssembly.Instance, module: WebAssembly.Module) => void) {
                WebAssembly.instantiate(wasmData, importObject).then((result: any) => {
                    receiveInstance(result.instance, result.module);
                }).catch(reject);
            }
        }).then(resolve).catch(reject);
    });
}
