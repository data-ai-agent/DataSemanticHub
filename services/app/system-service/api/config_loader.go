package main

import (
	"log"
	"os"
	"strings"

	"github.com/zeromicro/go-zero/core/conf"
)

func mustLoadConfig(path string, v any) {
	if err := loadConfig(path, v); err != nil {
		log.Fatalf("error: config file %s, %s", path, err.Error())
	}
}

func loadConfig(path string, v any) error {
	content, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	expanded := expandEnvWithDefault(string(content))
	return conf.LoadFromYamlBytes([]byte(expanded), v)
}

// expandEnvWithDefault supports ${VAR} and ${VAR:-default} placeholders.
func expandEnvWithDefault(input string) string {
	var b strings.Builder
	b.Grow(len(input))

	for i := 0; i < len(input); i++ {
		if input[i] != '$' || i+1 >= len(input) || input[i+1] != '{' {
			b.WriteByte(input[i])
			continue
		}

		close := strings.IndexByte(input[i+2:], '}')
		if close == -1 {
			b.WriteByte(input[i])
			continue
		}

		expr := input[i+2 : i+2+close]
		name, defValue, hasDefault := splitEnvDefault(expr)
		if name == "" {
			b.WriteString("${")
			b.WriteString(expr)
			b.WriteByte('}')
			i += close + 2
			continue
		}

		val, ok := os.LookupEnv(name)
		if ok && val != "" {
			b.WriteString(val)
		} else if hasDefault {
			b.WriteString(defValue)
		}

		i += close + 2
	}

	return b.String()
}

func splitEnvDefault(expr string) (name, defValue string, hasDefault bool) {
	if idx := strings.Index(expr, ":-"); idx != -1 {
		return expr[:idx], expr[idx+2:], true
	}
	return expr, "", false
}
