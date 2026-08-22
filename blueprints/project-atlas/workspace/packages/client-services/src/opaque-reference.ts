const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
function encode(bytes:Uint8Array){let bits=0,value=0,output="";for(const byte of bytes){value=(value<<8)|byte;bits+=8;while(bits>=6){bits-=6;output+=alphabet[(value>>bits)&63]}}if(bits>0)output+=alphabet[(value<<(6-bits))&63];return output}
export function createClientServiceOpaqueRef(entropy:()=>Uint8Array=()=>crypto.getRandomValues(new Uint8Array(24))):string{const bytes=entropy();if(bytes.byteLength!==24)throw new TypeError("192 bits required");return `csr1_${encode(bytes)}`}
