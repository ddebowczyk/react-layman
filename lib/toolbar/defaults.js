//#region src/toolbar/defaults.ts
var e = {
	items: [
		{
			kind: "builtin",
			id: "maximize",
			action: "window.maximize"
		},
		{
			kind: "builtin",
			id: "float",
			action: "window.float"
		},
		{
			kind: "builtin",
			id: "close",
			action: "window.close"
		}
	],
	overflow: "never"
};
//#endregion
export { e as defaultLaymanToolbar };
