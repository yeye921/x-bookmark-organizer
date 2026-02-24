import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main className="p-6 space-y-4">
      {/* 상단 버튼 영역 */}
      <div className="flex items-center gap-2">
        {/* 🔐 로그인 버튼 추가 */}
        <Button asChild variant="outline">
          <a href="/api/auth/x/start">X로 로그인</a>
        </Button>

        <Button>북마크 동기화</Button>
        <Input className="max-w-sm" placeholder="검색..." />
        <Badge>개발</Badge>
      </div>

      {/* 카드 샘플 */}
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>@username</CardTitle>
        </CardHeader>
        <CardContent>
          트윗 내용 미리보기… 폴더에 들어간 상태는 Badge로 표시.
        </CardContent>
      </Card>
    </main>
  );
}
