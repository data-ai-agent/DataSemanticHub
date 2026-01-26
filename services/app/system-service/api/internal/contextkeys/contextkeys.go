package contextkeys

// contextKey 用作 context.WithValue 的 key 类型，避免与其它包使用 string 冲突（SA1029）
type contextKey string

// UserIDKey 用于在 context 中存储当前用户 ID（JWT 解析后由 middleware 注入）
const UserIDKey contextKey = "user_id"
