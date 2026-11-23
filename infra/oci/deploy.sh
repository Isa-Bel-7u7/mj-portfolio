#!/usr/bin/env bash
set -euo pipefail

if [[ ! "$IMAGE_DIGEST" =~ ^sha256:[a-f0-9]{64}$ ]]; then
  echo 'Digest de imagen inválido.' >&2
  exit 2
fi

content=$(jq -n --arg text "exec sudo -n /usr/local/sbin/mj-portfolio-deploy $IMAGE_DIGEST" \
  '{source: {sourceType: "TEXT", text: $text}, output: {outputType: "TEXT"}}')
target=$(jq -n --arg id "$OCI_INSTANCE_ID" '{instanceId: $id}')

if ! oci instance-agent command list \
  --compartment-id "$OCI_COMPARTMENT_ID" --limit 1 >/dev/null; then
  echo '::error::OCI no permitió listar los comandos del compartimento. Revisa que la política IAM esté aplicada al grupo de OCI_USER en el dominio y compartimento correctos.'
  exit 1
fi
echo 'OCI confirmó acceso a los comandos del compartimento.'

if ! oci instance-agent command-execution list \
  --compartment-id "$OCI_COMPARTMENT_ID" --instance-id "$OCI_INSTANCE_ID" --limit 1 >/dev/null; then
  echo '::error::No se pudieron consultar las ejecuciones en OCI. Revisa la región, el compartimento y la instancia, y que el grupo del usuario OCI_USER tenga INSTANCE_AGENT_COMMAND_EXECUTION_INSPECT en ese compartimento.'
  exit 1
fi
echo 'OCI confirmó acceso a las ejecuciones de la instancia.'

if ! command_id=$(oci instance-agent command create \
  --compartment-id "$OCI_COMPARTMENT_ID" --target "$target" \
  --content "$content" --timeout-in-seconds 300 \
  --query 'data.id' --raw-output); then
  echo '::error::OCI permitió las consultas, pero rechazó CreateInstanceAgentCommand. Comprueba que la política efectiva del grupo de OCI_USER incluya INSTANCE_AGENT_COMMAND_CREATE en el compartimento de la VM.'
  exit 1
fi

echo "OCI Run Command enviado: $command_id"
error_log=$(mktemp)
trap 'rm -f "$error_log"' EXIT
previous_status=''

for attempt in {1..80}; do
  if ! execution=$(oci instance-agent command-execution get \
    --instance-id "$OCI_INSTANCE_ID" --command-id "$command_id" \
    2>"$error_log"); then
    if [[ -z $previous_status && $attempt -lt 12 ]] &&
      grep -q '"code": "NotAuthorizedOrNotFound"' "$error_log"; then
      sleep 5
      continue
    fi
    cat "$error_log" >&2
    echo "::error::No se pudo consultar el comando $command_id. Revisa su estado en Compute → Instances → Run command antes de volver a desplegar."
    exit 1
  fi

  status=$(jq -er '.data["lifecycle-state"]' <<<"$execution")
  delivery=$(jq -r '.data["delivery-state"] // "sin información"' <<<"$execution")
  current_status="$status / $delivery"
  if [[ $current_status != "$previous_status" ]]; then
    echo "Estado de OCI Run Command: $current_status"
    previous_status=$current_status
  fi

  case "$status" in
    SUCCEEDED|FAILED|TIMED_OUT|CANCELED) break ;;
    ACCEPTED|IN_PROGRESS)
      if [[ $delivery == EXPIRED ]]; then
        break
      fi
      sleep 5
      ;;
    *) break ;;
  esac
done

jq -r '.data.content | [.message, .text] | .[] | select(type == "string" and length > 0) | split("\n")[] | "  " + .' <<<"$execution"
exit_code=$(jq -r '.data.content["exit-code"] // "sin información"' <<<"$execution")
if [[ $status == SUCCEEDED && $exit_code == 0 ]]; then
  echo 'La VM confirmó el despliegue.'
  exit 0
fi

echo "::error::Despliegue sin confirmar. Estado: $current_status. Código de salida: $exit_code. Comando: $command_id"
if [[ $status == ACCEPTED || $delivery == EXPIRED ]]; then
  echo 'Revisa que Compute Instance Run Command esté Running y que el grupo dinámico de la VM tenga permisos sobre instance-agent-command-execution-family.'
fi
exit 1
