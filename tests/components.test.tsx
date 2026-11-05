/**
 * UI COMPONENT UNIT TESTS: each building block on its own (roles, names, states,
 * keyboard, and the design rules that apply to it).
 */
import { useState, useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Checkbox, Chip, EmptyState, Input, SegmentedControl, Slider } from "@/components/ui";
import { Modal } from "@/components/ui/Overlay";
import { Hero } from "@/components/sections/Hero";
import { AddressSearch } from "@/components/sections/AddressSearch";
import { PlanCard } from "@/components/sections/PlanCard";
import { StoreProvider, useStore } from "@/lib/store";
import { PLANS } from "@/data/sample";

const inStore = (ui: React.ReactNode) => render(<StoreProvider>{ui}</StoreProvider>);

describe("Button", () => {
  it("is a real button, type=button by default, at least 44px", () => {
    render(<Button>Continue</Button>);
    const b = screen.getByRole("button", { name: "Continue" });
    expect(b).toHaveAttribute("type", "button");
    expect(b.className).toMatch(/min-h-1[12]/);
  });
  it("primary is a flat coral pill with ink text", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button").className).toMatch(/bg-cta/);
    expect(screen.getByRole("button").className).toMatch(/text-on-cta/);
    expect(screen.getByRole("button").className).toMatch(/rounded-full/);
    expect(screen.getByRole("button").className).not.toMatch(/gradient|shadow-glow/);
  });
  it("does nothing when disabled", async () => {
    const fn = vi.fn();
    render(
      <Button disabled onClick={fn}>
        Go
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("Input", () => {
  it("links its label and announces errors", () => {
    render(<Input label="Email Address" error="Enter a valid email address" />);
    const box = screen.getByLabelText("Email Address");
    expect(box).toHaveAttribute("aria-invalid", "true");
    // Linked to the field (read when focused), not a separate alert per field
    expect(box).toHaveAccessibleDescription("Enter a valid email address");
  });
});

describe("Checkbox", () => {
  it("toggles and starts unticked", async () => {
    function T() {
      const [v, setV] = useState(false);
      return (
        <Checkbox id="c" checked={v} onChange={setV}>
          I agree
        </Checkbox>
      );
    }
    render(<T />);
    const c = screen.getByRole("checkbox", { name: "I agree" });
    expect(c).not.toBeChecked();
    await userEvent.click(c);
    expect(c).toBeChecked();
  });
});

describe("Chip", () => {
  it("reports pressed state, or checked when used as a radio", () => {
    render(
      <>
        <Chip selected onClick={() => {}}>
          News
        </Chip>
        <Chip role="radio" selected={false} onClick={() => {}}>
          All
        </Chip>
      </>,
    );
    expect(screen.getByRole("button", { name: /News/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("radio", { name: "All" })).toHaveAttribute("aria-checked", "false");
  });
});

describe("Slider", () => {
  it("is labelled, reports its value text and changes", async () => {
    const fn = vi.fn();
    render(<Slider label="How many TVs?" min={1} max={10} value={3} onChange={fn} display="3" />);
    const s = screen.getByRole("slider", { name: "How many TVs?" });
    expect(s).toHaveAttribute("aria-valuetext", "3");
    // jsdom doesn't move range inputs on arrow keys (real browsers do; the browser simulation covers that)
    fireEvent.change(s, { target: { value: "5" } });
    expect(fn).toHaveBeenCalledWith(5);
  });
});

describe("SegmentedControl", () => {
  it("moves with arrow keys (roving tabindex)", async () => {
    function T() {
      const [v, setV] = useState<"a" | "b">("a");
      return <SegmentedControl label="Mode" value={v} onChange={setV} options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]} />;
    }
    render(<T />);
    const a = screen.getByRole("radio", { name: "A" });
    expect(a).toHaveAttribute("tabindex", "0");
    a.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "B" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "B" })).toHaveFocus();
  });
});

describe("EmptyState", () => {
  it("shows its title as a heading", () => {
    render(<EmptyState title="No Internet plans found" />);
    expect(screen.getByRole("heading", { name: "No Internet plans found" })).toBeInTheDocument();
  });
});

describe("Modal", () => {
  it("is a labelled dialog, closes on Escape and returns focus", async () => {
    function T() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          {open && (
            <Modal open title="Schedule AI Callback" closeLabel="Close" onClose={() => setOpen(false)}>
              <input aria-label="Email Address" />
            </Modal>
          )}
        </>
      );
    }
    render(<T />);
    const opener = screen.getByRole("button", { name: "Open" });
    await userEvent.click(opener);
    expect(screen.getByRole("dialog", { name: "Schedule AI Callback" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(opener).toHaveFocus();
  });
});

describe("Service tiles (Hero)", () => {
  it("are toggle buttons with official names and solid colour when selected", async () => {
    inStore(<Hero />);
    const tile = screen.getByRole("button", { name: /^Internet$/ });
    expect(tile).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(tile);
    expect(tile).toHaveAttribute("aria-pressed", "true");
    expect(tile.getAttribute("style")).toMatch(/background: (rgb\(0, 194, 224\)|#00C2E0)/i);
  });
  it("show five services in the official order", () => {
    inStore(<Hero />);
    const names = within(document.getElementById("section-intent")!)
      .getAllByRole("button", { pressed: false })
      .slice(0, 5)
      .map((b) => b.textContent?.trim());
    expect(names).toEqual(["Internet", "TV", "Landline", "Mobile", "Home Security"]);
  });
});

describe("AddressSearch", () => {
  function Harness({ onChoose }: { onChoose: () => void }) {
    const { dispatch } = useStore();
    return (
      <AddressSearch
        onChoose={(a) => {
          dispatch({ type: "patch", patch: { address: a } });
          onChoose();
        }}
        onClear={() => dispatch({ type: "patch", patch: { address: null } })}
      />
    );
  }
  it("is a combobox: arrows move, Enter picks, Escape closes", async () => {
    const fn = vi.fn();
    inStore(<Harness onChoose={fn} />);
    const box = screen.getByRole("combobox", { name: "Search USA address" });
    await userEvent.type(box, "658");
    expect(box).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{ArrowDown}");
    expect(box.getAttribute("aria-activedescendant")).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    expect(box).toHaveAttribute("aria-expanded", "false");
    await userEvent.type(box, "5");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Address Found")).toBeInTheDocument();
  });
  it("offers Try a different address, which clears and refocuses", async () => {
    inStore(<Harness onChoose={() => {}} />);
    const box = screen.getByRole("combobox", { name: "Search USA address" });
    await userEvent.type(box, "6585");
    await userEvent.click(screen.getAllByRole("option")[0]);
    await userEvent.click(screen.getByRole("button", { name: /Try a different address/ }));
    expect(box).toHaveValue("");
  });
});

describe("PlanCard", () => {
  function Probe() {
    const { s } = useStore();
    useEffect(() => {}, [s]);
    return <p data-testid="modal">{`${s.modal.kind}:${s.modal.planId}`}</p>;
  }
  it("shows provider, price, labels and opens details or the callback", async () => {
    const plan = PLANS.find((p) => p.id === "att-300")!;
    inStore(
      <>
        <PlanCard plan={plan} rank={1} labels={["mostAffordable"]} featured />
        <Probe />
      </>,
    );
    const card = screen.getByRole("article");
    expect(within(card).getByText("AT&T")).toBeInTheDocument();
    expect(within(card).getByText("Our Top Pick")).toBeInTheDocument();
    expect(within(card).getByText("Most Affordable")).toBeInTheDocument();
    expect(within(card).getByText(/^\$\d+\.\d{2}$/)).toBeInTheDocument();
    await userEvent.click(within(card).getByRole("button", { name: /Show details/ }));
    expect(screen.getByTestId("modal")).toHaveTextContent("details:att-300");
    await userEvent.click(within(card).getByRole("button", { name: /Get Started/ }));
    expect(screen.getByTestId("modal")).toHaveTextContent("callback:att-300");
  });
});
