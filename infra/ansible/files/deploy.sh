#!/usr/bin/env bash
set -euo pipefail

cd /opt/mj
exec 9>/run/lock/mj-portfolio-deploy.lock
flock -w 60 9

if [[ $# -ne 1 ]]; then
  echo 'Uso: mj-portfolio-deploy sha256:DIGEST o latest para el primer arranque' >&2
  exit 2
fi

repository=$(cat repository)
if [[ $1 == latest ]]; then
  candidate="$repository:latest"
elif [[ $1 =~ ^sha256:[a-f0-9]{64}$ ]]; then
  candidate="$repository@$1"
else
  echo 'Digest inválido' >&2
  exit 2
fi

# Prepara y verifica la imagen antes de tocar la versión que está en ejecución.
docker pull "$candidate"
if [[ $1 == latest ]]; then
  candidate=$(docker image inspect "$candidate" --format '{{range .RepoDigests}}{{println .}}{{end}}' | grep -F "$repository@" | head -n 1)
fi
previous=$(sed -n 's/^PORTFOLIO_IMAGE=//p' .env)
candidate_env=$(mktemp ./.env.candidate.XXXXXX)
trap 'rm -f "$candidate_env"' EXIT
printf 'PORTFOLIO_IMAGE=%s\n' "$candidate" > "$candidate_env"

if env PORTFOLIO_IMAGE="$candidate" docker compose up -d --wait --wait-timeout 65; then
  chmod 0644 "$candidate_env"
  mv -f "$candidate_env" .env
else
  echo 'La imagen nueva no quedó saludable. Restaurando la configuración anterior.' >&2
  if [[ -n $previous && $previous != "$candidate" ]]; then
    env PORTFOLIO_IMAGE="$previous" docker compose up -d --wait --wait-timeout 65
  fi
  exit 1
fi
