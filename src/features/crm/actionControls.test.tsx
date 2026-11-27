import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ACTION_ICONS,
  ActionIconButton,
  RowActionsBar,
  formatCompactDate,
} from "@/features/crm/actionControls";

afterEach(() => {
  cleanup();
});

describe("Action controls", () => {
  it("exposes accessible labels and invokes handlers", () => {
    const onClick = vi.fn();
    render(
      <ActionIconButton
        icon={ACTION_ICONS.edit}
        label="Edit customer"
        onClick={onClick}
      />,
    );
    const button = screen.getByRole("button", { name: "Edit customer" });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("marks danger delete actions in the overflow menu", async () => {
    const onDelete = vi.fn();
    render(
      <RowActionsBar
        primary={[
          {
            id: "view",
            label: "View details",
            icon: ACTION_ICONS.view,
            onClick: vi.fn(),
          },
        ]}
        menuItems={[
          {
            id: "delete",
            label: "Delete",
            icon: ACTION_ICONS.delete,
            tone: "danger",
            onSelect: onDelete,
          },
        ]}
      />,
    );
    const more = screen.getByRole("button", { name: "More actions" });
    fireEvent.pointerDown(more, { button: 0, ctrlKey: false });
    fireEvent.keyDown(more, { key: "Enter" });
    const deleteItem = await screen.findByRole("menuitem", { name: "Delete" });
    expect(deleteItem.className).toMatch(/text-danger/);
    fireEvent.click(deleteItem);
    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
  });

  it("formats compact dates consistently", () => {
    expect(formatCompactDate("2026-11-27")).toMatch(/27 Nov 2026/);
    expect(formatCompactDate(null)).toBe("—");
    expect(formatCompactDate("already-text")).toBe("already-text");
  });
});
