export function ToolbarButton({
    children,
    type = "button",
    ...props
}: React.ComponentProps<"button">) {
    return (
        <button className="toolbar-button" type={type} {...props}>
            {children}
        </button>
    );
}
