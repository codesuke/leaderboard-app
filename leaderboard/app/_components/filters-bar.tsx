"use client";

import { useState } from "react";
import { FilterIcon, XIcon } from "lucide-react";
import {
  describeActiveFilters,
  removeFilterChip,
  type StudentFilters,
} from "@/app/_lib/filtering";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FilterControls } from "./filter-controls";

interface FiltersBarProps {
  filters: StudentFilters;
  onChange: (filters: StudentFilters) => void;
  branches: string[];
}

export function FiltersBar({ filters, onChange, branches }: FiltersBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const chips = describeActiveFilters(filters);

  const chipsRow = chips.length > 0 && (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="outline"
          className="gap-1 rounded-full pr-1.5"
        >
          {chip.label}
          <button
            type="button"
            aria-label={`Remove ${chip.label} filter`}
            className="rounded-full p-0.5 hover:bg-muted"
            onClick={() => onChange(removeFilterChip(filters, chip.key))}
          >
            <XIcon className="size-3" />
          </button>
        </Badge>
      ))}
      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground"
        onClick={() => onChange({})}
      >
        Clear all
      </button>
    </div>
  );

  return (
    <>
      <div className="hidden flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/30 ring-1 ring-white/[0.03] lg:flex">
        {chipsRow}
        <FilterControls
          filters={filters}
          onChange={onChange}
          branches={branches}
        />
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {chipsRow}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" className="w-fit rounded-full px-4">
                <FilterIcon data-icon="inline-start" />
                Filters
                {chips.length > 0 && (
                  <Badge className="bg-primary/15 text-primary">
                    {chips.length}
                  </Badge>
                )}
              </Button>
            }
          />
          <SheetContent
            side="bottom"
            className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
          >
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-4">
              <FilterControls
                filters={filters}
                onChange={onChange}
                branches={branches}
              />
            </div>
            <SheetFooter className="flex-row justify-between">
              <Button
                variant="ghost"
                onClick={() => onChange({})}
                disabled={chips.length === 0}
              >
                Clear all
              </Button>
              <Button onClick={() => setSheetOpen(false)}>Done</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
