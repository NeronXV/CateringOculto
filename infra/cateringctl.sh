#!/bin/sh
set -eu
cd /srv/apps/catering-oculto/current
export RELEASE_TAG=20261003-json-fix
export SECRETS_DIRECTORY=/srv/apps/catering-oculto/shared/secrets
compose() { docker compose -p catering-oculto -f infra/compose.yaml -f infra/compose.shared.yaml "$@"; }
case "${1:-}" in
  status) compose ps ;;
  validate) compose config --quiet ;;
  logs) case "${2:-}" in app|db|migrate) compose logs --tail 100 "$2" ;; *) echo 'Elige app, db o migrate' >&2; exit 1;; esac ;;
  *) echo 'Uso: cateringctl.sh status|validate|logs app|db|migrate' >&2; exit 1 ;;
esac
