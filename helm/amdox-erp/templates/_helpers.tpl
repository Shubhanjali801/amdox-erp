{{- define "amdox.databaseUrl" -}}
postgresql://amdox:{{ .Values.secrets.DB_PASSWORD }}@postgres:5432/amdox_erp
{{- end -}}

{{- define "amdox.redisUrl" -}}
redis://redis:6379
{{- end -}}
