import { MdSearch, MdAdd } from "react-icons/md";
import { Input, Button } from "@heroui/react";

interface IWorkspaceOverviewProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCreate: () => void;
}

export function WorkspaceOverview({
  searchQuery,
  onSearchChange,
  onOpenCreate,
}: IWorkspaceOverviewProps) {
  return (
    <section className="sticky top-0 z-40 w-full bg-paper-white shadow-[0px_5px_10px_0px_rgba(0,0,0,0.06)] px-margin-lg py-space-md mb-space-lg">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        {/* Title */}
        <div className="flex flex-col">
          <div className="flex items-center gap-space-sm">
            <h1 className="font-headline-md text-headline-md text-charcoal-ink tracking-tight">
              Workspace Overview
            </h1>
          </div>
        </div>

        {/* Controls & Quick Actions */}
        <div className="flex flex-wrap items-center gap-space-sm sm:gap-space-md">
          {/* Search & Filter Cluster */}
          <div className="relative flex items-center min-w-65 sm:min-w-[320px]">
            <MdSearch className="absolute left-3 text-steel-gray text-[18px] pointer-events-none z-10" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter tasks by title or actor..."
              className="w-full pl-9 pr-20 py-2 bg-paper-white rounded-[4px] font-label-sm text-label-sm text-charcoal-ink placeholder-mist-gray shadow-subtle focus:shadow-[inset_0px_0px_0px_1.5px_#303b4b] focus:outline-none transition-all"
            />
          </div>

          {/* Primary Action Trigger */}
          <Button
            onPress={onOpenCreate}
            className="inline-flex items-center justify-center gap-space-xs px-space-md py-2.5 bg-studio-orange hover:bg-secondary active:translate-y-px text-paper-white font-label-md text-label-md rounded-[6px] shadow-[0px_4px_12px_rgba(244,81,28,0.24)] transition-all cursor-pointer border-none h-auto"
          >
            <MdAdd className="text-[20px]" />
            <span>New Task</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
