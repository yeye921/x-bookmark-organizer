import { useState } from "react";
import {
  Bookmark,
  Code,
  Palette,
  Rocket,
  Brain,
  Heart,
  FolderPlus,
  MoreHorizontal,
  Search,
  ChevronLeft,
} from "lucide-react";
import { folders } from "@/data/mockBookmarks";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  bookmark: Bookmark,
  code: Code,
  palette: Palette,
  rocket: Rocket,
  brain: Brain,
  heart: Heart,
};

interface FolderSidebarProps {
  selectedFolder: string;
  onSelectFolder: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function FolderSidebar({
  selectedFolder,
  onSelectFolder,
  collapsed,
  onToggleCollapse,
}: FolderSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={cn(
        "h-screen border-r border-border flex flex-col transition-all duration-200 shrink-0",
        collapsed ? "w-[68px]" : "w-[280px]"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        {!collapsed && (
          <h1 className="text-xl font-bold tracking-tight">북마크</h1>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-full hover:bg-accent transition-colors"
        >
          <ChevronLeft
            className={cn(
              "h-5 w-5 text-foreground transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-3">
          <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="폴더 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}

      {/* Folders */}
      <nav className="flex-1 overflow-y-auto py-2">
        {filteredFolders.map((folder) => {
          const Icon = iconMap[folder.icon] || Bookmark;
          const isActive = selectedFolder === folder.id;

          return (
            <button
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
                "hover:bg-accent",
                isActive && "bg-accent font-semibold"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              {!collapsed && (
                <>
                  <span className="flex-1 text-[15px]">{folder.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {folder.count}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Add Folder */}
      <div className="p-3 border-t border-border">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent transition-colors">
          <FolderPlus className="h-5 w-5 text-primary shrink-0" />
          {!collapsed && (
            <span className="text-[15px] text-primary font-medium">
              새 폴더
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
