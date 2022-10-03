import { registerLibDir, registerCustomElementsDir } from "@nfjs/front-server";

export async function init() {
    registerLibDir('quill');
    registerCustomElementsDir('@nfaddon/quill');
    
}