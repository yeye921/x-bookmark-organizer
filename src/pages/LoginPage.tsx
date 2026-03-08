import { useAuth } from "@/hooks/useAuth";
import { useTwitterAuth } from "@/hooks/useTwitterAuth";
import { Navigate } from "react-router-dom";
import { Bookmark, Loader2 } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const { connectTwitter, connecting } = useTwitterAuth();
  const [error, setError] = useState("");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/home" replace />;

  const handleLogin = async () => {
    setError("");
    try {
      await connectTwitter();
    } catch (err: any) {
      setError(err.message || "로그인에 실패했습니다");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Bookmark className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">X 북마크 매니저</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            X 북마크를 폴더로 정리하세요
          </p>
        </div>

        {error && (
          <p className="text-destructive text-sm text-center">{error}</p>
        )}

        {/* X Login Button */}
        <button
          onClick={handleLogin}
          disabled={connecting}
          className="w-full py-3 rounded-full bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {connecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          )}
          {connecting ? "연결 중..." : "X로 로그인"}
        </button>
      </div>
    </div>
  );
}
