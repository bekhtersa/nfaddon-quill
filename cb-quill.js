import { PlElement, html, css } from "polylib";
import "quill";
import { debounce } from "@plcmp/utils";
const cssCore = await (await fetch("/quill/dist/quill.core.css")).text();
const cssTheme = await (await fetch("/quill/dist/quill.snow.css")).text();
const TOOLBAR_CONFIG = [
    [{ header: ['1', '2', '3', false] }],
    [{ align: ['', 'center', 'right']}],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['clean']
  ];
class CBQuill extends PlElement {
    editor = null;
    static properties = {
        value: {
            type: String,
            value: null,
            observer: 'changeValue'
        }
    }

    connectedCallback(){
        super.connectedCallback();
        this.editor = new Quill( this.$.editor, {
            modules: {
                toolbar: TOOLBAR_CONFIG
            },
            theme: 'snow'
        });
        this.editor.on('text-change', (delta, oldDelta, source) => {
            let debouncer = debounce(() => {
                this.fromEditor = true;
                this.value = this.editor.root.innerHTML;
                this.fromEditor = false;
            }, 100)
            debouncer();
        });
        function contains(parent, descendant) {
            try {
              // Firefox inserts inaccessible nodes around video elements
              descendant.parentNode;
            } catch (e) {
              return false;
            }
            // IE11 has bug with Text nodes
            // https://connect.microsoft.com/IE/feedback/details/780874/node-contains-is-incorrect
            if (descendant instanceof Text) {
              descendant = descendant.parentNode;
            }
            return parent.contains(descendant);
        }
        const normalizeNative = (nativeRange) => {

            // document.getSelection model has properties startContainer and endContainer
            // shadow.getSelection model has baseNode and focusNode
            // Unify formats to always look like document.getSelection 
          
            if (nativeRange) {
          
              const range = nativeRange;
              
              if (range.baseNode) {  
                range.startContainer = nativeRange.baseNode;
                range.endContainer = nativeRange.focusNode;
                range.startOffset = nativeRange.baseOffset;
                range.endOffset = nativeRange.focusOffset;
          
                if (range.endOffset < range.startOffset) {
                  range.startContainer = nativeRange.focusNode;
                  range.endContainer = nativeRange.baseNode;    
                  range.startOffset = nativeRange.focusOffset;
                  range.endOffset = nativeRange.baseOffset;
                }
              }
          
              if (range.startContainer) {
                if (!contains(this.editor.root, range.startContainer) || !range.collapsed && !contains(this.editor.root, range.endContainer)) {
                    return null;
                }
                return {
                  start: { node: range.startContainer, offset: range.startOffset },
                  end: { node: range.endContainer, offset: range.endOffset },
                  native: range
                };
              }
            }
          
            return null
          };
          
          // Hack Quill and replace document.getSelection with shadow.getSelection 
          
          this.editor.selection.getNativeRange = () => {
            
            const dom = this.editor.root.getRootNode();
            const selection = dom.getSelection();
            const range = normalizeNative(selection);
            
            return range;
          };
          
          // Subscribe to selection change separately, 
          // because emitter in Quill doesn't catch this event in Shadow DOM
          
          document.addEventListener("selectionchange", (...args) => {
          
            // Update selection and some other properties
          
            this.editor.selection.update()
          });
    }

    static get css() {
        return css(`
            ${cssCore}
            ${cssTheme}
            :host{
                display: flex;
                height: 100%;
                width: 100%;
                flex-direction: column;
            }
            #editor{
                contain: size;
            }
        `);
    } 

    static template = html`
        <div id="editor"></div>
    `;

    changeValue(value){
        if(this.fromEditor){
            return;
        }
        this.editor.root.innerHTML = value;
    }
}

customElements.define('cb-quill', CBQuill);