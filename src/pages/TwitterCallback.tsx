import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTwitterAuth } from "@/hooks/useTwitterAuth";
import { Loader2 } from "lucide-react";

export default function TwitterCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useTwitterAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code && state) {
      handleCallback(code, state)
        .then(() => {
          navigate("/", { replace: true });
        })
        .catch((err) => {
          console.error("Twitter callback error:", err);
          setError(err.message);
        });
    } else {
      setError("Missing authorization code");
    }
  }, [searchParams, handleCallback, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="text-sm text-primary hover:underline"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground text-sm">X 계정을 연결하는 중...</p>
      </div>
    </div>
  );
}
