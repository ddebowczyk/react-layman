//#region src/laymanId.ts
function e() {
	let e = globalThis.crypto?.randomUUID;
	return e ? e.call(globalThis.crypto) : `layman-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
//#endregion
export { e as createLaymanId };
