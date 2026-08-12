import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {ToolbarButton} from "../src/ToolbarButton";

describe("ToolbarButton", () => {
    beforeEach(() => vi.useRealTimers());

    it("does not submit a host form unless the host explicitly asks it to", async () => {
        const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
        const user = userEvent.setup();
        render(
            <form onSubmit={onSubmit}>
                <ToolbarButton>Run action</ToolbarButton>
            </form>
        );

        await user.click(screen.getByRole("button", {name: "Run action"}));

        expect(onSubmit).not.toHaveBeenCalled();
    });
});
