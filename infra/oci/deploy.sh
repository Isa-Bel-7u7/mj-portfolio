#!/usr/bin/env bash
set -euo pipefail

if [[ ! "$IMAGE_DIGEST" =~ ^sha256:[a-f0-9]{64}$ ]]; then
  echo 'Digest de imagen inválido.' >&2
  exit 2
fi

content=$(jq -n --arg text "exec sudo -n /usr/local/sbin/mj-portfolio-deploy $IMAGE_DIGEST" \
  '{source: {sourceType: "TEXT", text: $text}, output: {outputType: "TEXT"}}')
target=$(jq -n --arg id "$OCI_INSTANCE_ID" '{instanceId: $id}')

command_id=$(oci instance-agent command create \
  --compartment-id "$OCI_COMPARTMENT_ID" --target "$target" \
  --content "$content" --timeout-in-seconds 300 \
  --query 'data.id' --raw-output)

for attempt in {1..80}; do
  status=$(oci instance-agent command-execution get \
    --instance-id "$OCI_INSTANCE_ID" --command-id "$command_id" \
    --query 'data."lifecycle-state"' --raw-output)
  case "$status" in
    SUCCEEDED) exit 0 ;;
    ACCEPTED|IN_PROGRESS) sleep 5 ;;
    *)
      echo "OCI Run Command terminó con estado $status. Comando: $command_id" >&2
      exit 1 ;;
  esac
done

echo "Tiempo de espera agotado para OCI Run Command: $command_id" >&2
exit 1
