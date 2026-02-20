# 환경 변수 설정 가이드

`.env.local` 파일을 프로젝트 루트에 생성하고 아래 변수를 채워 사용하세요.
이 파일은 **절대 git에 커밋하지 않습니다** (`.gitignore`에 이미 포함되어 있습니다).

## 필수 환경 변수

```bash
# Notion Integration 시크릿
# https://www.notion.so/my-integrations 에서 발급
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 견적서 Database ID
# Notion DB URL에서 추출: https://www.notion.so/{workspace}/{DATABASE_ID}?v=...
NOTION_INVOICE_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 견적 항목 Database ID
NOTION_ITEM_DB_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 어드민 API 인증 토큰 (강력한 랜덤 문자열 사용)
ADMIN_SECRET=your-strong-random-secret-here
```

## Notion 설정 방법

1. [Notion My Integrations](https://www.notion.so/my-integrations) 접속
2. "New Integration" 클릭 → 이름 입력 → Submit
3. "Internal Integration Token" 복사 → `NOTION_API_KEY`에 붙여넣기
4. 견적서 DB와 항목 DB에서 각각 "..." > "Add connections" > Integration 추가
5. DB URL에서 32자리 ID 추출 → `NOTION_INVOICE_DB_ID`, `NOTION_ITEM_DB_ID`에 입력
