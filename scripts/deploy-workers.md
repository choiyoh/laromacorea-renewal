# 🦭 Cloudflare Workers CDN 프록시 배포 가이드

이 가이드는 Firebase Storage의 무시무시한 대역폭 요금을 완전히 0원으로 차단하기 위해, **Cloudflare Workers**에 프록시 캐시 서버를 배포하는 방법을 다룹니다.

이 작업을 마치면 사용자가 이미지를 조회할 때 구글 서버(Firebase) 대신 Cloudflare 엣지 캐시 서버에서 전송이 이루어져 대역폭 요금이 사실상 발생하지 않게 됩니다.

---

## 1. Cloudflare Workers 소스 코드

Cloudflare 대시보드에 배포할 **`index.js`** 소스 코드입니다. 아래 코드를 그대로 복사해서 사용하세요.

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Firebase Storage 오리지널 호스트 주소
    const targetHost = "https://firebasestorage.googleapis.com";
    
    // 프록시 경로 접두사인 '/storage-proxy' 제거 처리
    let pathname = url.pathname;
    if (pathname.startsWith("/storage-proxy")) {
      pathname = pathname.substring("/storage-proxy".length);
    }
    
    // Firebase Storage 타겟 주소 완성
    const targetUrl = new URL(pathname + url.search, targetHost);

    // 1. GET 메서드가 아니면 캐싱 없이 통과시킵니다.
    if (request.method !== "GET") {
      return fetch(targetUrl.toString(), request);
    }

    // 2. Cloudflare Edge Server에 강제 캐싱 지시 (4주간 보관)
    // 쿼리 파라미터(alt=media&token=...)가 달린 경로도 cacheEverything을 통해 영구 캐싱됩니다.
    const response = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: request.headers,
      cf: {
        cacheEverything: true,
        cacheTtl: 2419200, // 28일 (초 단위)
      }
    });

    // 3. 브라우저 캐싱과 CORS 대응을 위해 헤더 가공
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Cache-Control", "public, max-age=2419200, immutable");
    newHeaders.set("Access-Control-Allow-Origin", "*"); // CORS 오류 원천 차단

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
}
```

---

## 2. 1분 만에 수동 배포하는 방법

가장 단순하고 빠르게 웹 대시보드에서 배포하는 과정입니다.

1.  **Cloudflare 로그인 및 가입**
    *   [Cloudflare 대시보드](https://dash.cloudflare.com/)에 로그인합니다.
2.  **Workers & Pages 진입**
    *   왼쪽 사이드바 메뉴에서 **Workers & Pages** ➡️ **Overview**를 클릭합니다.
    *   **Create Application** 버튼을 누른 후, **Create Worker**를 선택합니다.
3.  **Worker 생성**
    *   Worker의 이름을 정합니다 (예: `laromacorea-media`).
    *   **Deploy** 버튼을 누릅니다. (기본 샘플 코드로 즉시 배포됨)
4.  **소스 코드 교체 및 저장**
    *   배포가 완료되면 우측 상단의 **Edit Code** 버튼을 클릭하여 웹 에디터로 진입합니다.
    *   기존 에디터의 코드를 모두 지우고, 위의 **1. Workers 소스 코드**를 그대로 복사하여 붙여넣습니다.
    *   우측 상단의 **Save and Deploy** 버튼을 클릭하여 반영합니다.
5.  **확인**
    *   생성된 Workers 도메인 주소(예: `https://laromacorea-media.xxx.workers.dev`)를 확인합니다.
    *   로컬 개발 환경의 `.env` 파일에 해당 주소를 등록하여 연동을 완료합니다.

---

## 3. 커스텀 도메인 매핑 (선택 사항 - 권장)

상대 경로 `/storage-proxy`를 쓰는 것 대신 커뮤니티의 서브도메인을 직접 CDN 주소로 연결하고 싶을 때 사용합니다.

1.  Cloudflare에 등록된 도메인 관리 화면으로 이동합니다.
2.  Workers 페이지의 **Triggers** 탭으로 이동합니다.
3.  **Custom Domains** 하위에서 **Add Custom Domain** 버튼을 누릅니다.
4.  사용할 서브도메인(예: `media-cdn.laromacorea.com`)을 기입하고 추가합니다.
5.  도메인 DNS가 자동으로 매핑되며, 이제 프론트엔드 환경변수 `VITE_MEDIA_CDN_URL`을 해당 도메인 주소로 설정하시면 됩니다.
