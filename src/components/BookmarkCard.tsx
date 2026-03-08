import {
  Heart,
  Repeat2,
  MessageCircle,
  BarChart3,
  MoreHorizontal,
  ExternalLink,
  FolderInput,
  Trash2,
  BadgeCheck,
  Check,
  ChevronRight,
} from "lucide-react";
import type { Bookmark, Folder } from "@/data/mockBookmarks";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ImageGrid } from "./ImageGrid";

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  folders: Folder[];
  onMoveToFolder: (bookmarkId: string, folderId: string | null) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
}

export function BookmarkCard({ bookmark, folders, onMoveToFolder, onDeleteBookmark }: BookmarkCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showFolderSub, setShowFolderSub] = useState(false);

  const closeAll = () => {
    setShowMenu(false);
    setShowFolderSub(false);
  };

  return (
    <article className="px-4 py-3 border-b border-border hover:bg-accent/50 transition-colors cursor-pointer">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
          {getInitials(bookmark.author.name)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Author line */}
          <div className="flex items-center gap-1 text-[15px]">
            <span className="font-bold truncate">{bookmark.author.name}</span>
            {bookmark.author.verified && (
              <BadgeCheck className="h-[18px] w-[18px] text-primary shrink-0" />
            )}
            <span className="text-muted-foreground truncate">
              {bookmark.author.handle}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground text-sm">
              {bookmark.timestamp}
            </span>

            {/* More menu */}
            <div className="ml-auto relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={closeAll}
                  />
                  <div className="absolute right-0 top-8 z-20 w-52 bg-popover border border-border rounded-xl shadow-xl py-1 overflow-hidden max-h-[400px] overflow-y-auto">
                    {/* Folder modify toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFolderSub((prev) => !prev);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-sm transition-colors"
                    >
                      <FolderInput className="h-4 w-4" />
                      <span className="flex-1 text-left">폴더 수정</span>
                      <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", showFolderSub && "rotate-90")} />
                    </button>

                    {/* Inline folder list */}
                    {showFolderSub && (
                      <div className="border-t border-border">
                        <button
                          onClick={() => {
                            onMoveToFolder(bookmark.id, null);
                            closeAll();
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 pl-8 pr-4 py-2.5 hover:bg-accent text-sm transition-colors text-left",
                            bookmark.folderId === null && "text-primary font-medium"
                          )}
                        >
                          미분류
                          {bookmark.folderId === null && <Check className="h-3.5 w-3.5 ml-auto" />}
                        </button>
                        {folders
                          .filter((f) => f.id !== "all")
                          .map((folder) => (
                            <button
                              key={folder.id}
                              onClick={() => {
                                onMoveToFolder(bookmark.id, folder.id);
                                closeAll();
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 pl-8 pr-4 py-2.5 hover:bg-accent text-sm transition-colors text-left",
                                bookmark.folderId === folder.id && "text-primary font-medium"
                              )}
                            >
                              {folder.name}
                              {bookmark.folderId === folder.id && <Check className="h-3.5 w-3.5 ml-auto" />}
                            </button>
                          ))}
                        <div className="border-t border-border" />
                      </div>
                    )}

                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-sm transition-colors">
                      <ExternalLink className="h-4 w-4" />
                      원문 보기
                    </button>
                    <button
                      onClick={() => {
                        onDeleteBookmark(bookmark.id);
                        closeAll();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-sm text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      북마크 삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <p className="text-[15px] leading-relaxed mt-1 whitespace-pre-wrap">
            {bookmark.content}
          </p>

          {/* Images */}
          {bookmark.images && bookmark.images.length > 0 && (
            <ImageGrid images={bookmark.images} />
          )}

          {/* Engagement */}
          <div className="flex items-center justify-between mt-3 max-w-[425px]">
            <button className="group flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <div className="p-1.5 rounded-full group-hover:bg-primary/10 transition-colors">
                <MessageCircle className="h-4 w-4" />
              </div>
              <span className="text-xs">{formatNumber(bookmark.replies)}</span>
            </button>
            <button className="group flex items-center gap-1.5 text-muted-foreground hover:text-green-500 transition-colors">
              <div className="p-1.5 rounded-full group-hover:bg-green-500/10 transition-colors">
                <Repeat2 className="h-4 w-4" />
              </div>
              <span className="text-xs">
                {formatNumber(bookmark.retweets)}
              </span>
            </button>
            <button className="group flex items-center gap-1.5 text-muted-foreground hover:text-pink-500 transition-colors">
              <div className="p-1.5 rounded-full group-hover:bg-pink-500/10 transition-colors">
                <Heart className="h-4 w-4" />
              </div>
              <span className="text-xs">{formatNumber(bookmark.likes)}</span>
            </button>
            <button className="group flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <div className="p-1.5 rounded-full group-hover:bg-primary/10 transition-colors">
                <BarChart3 className="h-4 w-4" />
              </div>
              <span className="text-xs">{formatNumber(bookmark.views)}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
