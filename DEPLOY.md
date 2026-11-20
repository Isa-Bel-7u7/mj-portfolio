# Despliegue del portafolio MJ

El aprovisionamiento de AWS, la primera ejecución de Ansible y la activación del dominio se hacen desde tus cuentas. Después del alta inicial, los pushes a `main` actualizan el contenedor en la VM existente. AWS puede facturar EC2, EBS, IPv4 pública y transferencia. Revisa tus tarifas y presupuesto antes de crear recursos.

## 1. Docker Hub y GitHub

1. En Docker Hub crea un repositorio **público** llamado `mj-portfolio` y un token de acceso personal con permisos de lectura y escritura. El contenedor en la VM descarga la imagen pública.
2. En GitHub crea un repositorio vacío. En **Settings → Secrets and variables → Actions → Variables** guarda `DOCKERHUB_USERNAME`. En **Secrets** guarda el token como `DOCKERHUB_TOKEN`.
3. En PowerShell, desde esta carpeta, instala las dependencias para generar el lockfile y sube primero `dev`. Sustituye los valores de remotos por los tuyos. Si Git te solicita identidad, configura tu nombre y correo con `git config user.name` y `git config user.email`.

```powershell
npm.cmd install
git init -b dev
git add .
git commit -m "Crear portafolio MJ y pipeline DevOps"
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin dev
```

4. En **Actions** abre **Pruebas automatizadas** y revisa los resultados. Una vez aprobados, crea `main` desde ese commit, publícala y elígela como rama predeterminada desde GitHub para los siguientes cambios.

```powershell
git switch -c main
git push -u origin main
```

En el primer push a `main`, GitHub publica `TU_USUARIO_DOCKERHUB/mj-portfolio:latest` y una etiqueta con el SHA del commit. El trabajo de despliegue queda pendiente de la configuración de AWS.

## 2. Crear la VM con Terraform

1. Instala Terraform, AWS CLI y OpenSSH. Usa un perfil AWS autorizado para administrar EC2, VPC, IAM y Systems Manager. Si tu cuenta usa IAM Identity Center, configura el perfil con `aws configure sso --profile mj` e inicia sesión con `aws sso login --profile mj`. Las credenciales se configuran en tu equipo.
2. Genera una clave desde PowerShell y conserva el archivo privado en tu equipo.

```powershell
ssh-keygen -t ed25519 -f "$env:USERPROFILE\.ssh\mj-portfolio"
Get-Content "$env:USERPROFILE\.ssh\mj-portfolio.pub"
```

3. Crea `terraform.tfvars` a partir de `terraform.tfvars.example`. Pega la línea completa de la clave **pública**, completa tu IPv4 pública con `/32` y escribe el repositorio GitHub con su nombre exacto. Si ya existe el proveedor de OIDC de GitHub en IAM, añade su ARN al campo indicado para reutilizarlo.
4. Revisa el plan antes de aplicarlo. Los comandos usan el perfil `mj` del ejemplo.

```powershell
$env:AWS_PROFILE = "mj"
aws sts get-caller-identity
Set-Location infra/terraform
Copy-Item terraform.tfvars.example terraform.tfvars
notepad terraform.tfvars
terraform init
terraform fmt
terraform fmt -check
terraform validate
terraform plan -out=mj.tfplan
terraform apply mj.tfplan
terraform output
Set-Location ../..
```

Terraform crea una VPC con una subred pública y otra privada, una instancia Ubuntu 24.04 LTS x86-64 obtenida de Canonical y una IP pública elástica. La VM queda en la subred pública. El grupo de seguridad abre 80/443 y restringe SSH al `/32` elegido. Conserva el estado local de Terraform para modificar o retirar los recursos posteriormente. Revisa el [buscador de imágenes oficiales de Canonical](https://ubuntu.com/aws/docs/aws-how-to/instances/find-ubuntu-images/).

## 3. Crear el nombre en Cloudflare

1. Agrega a Cloudflare un dominio que controles y sigue las instrucciones para activar la zona en tu registrador.
2. En **DNS → Records** crea un registro **A** llamado `portafolio` que apunte a `public_ip` de Terraform. Empieza en **DNS only** para que Caddy pueda obtener el certificado del origen. Usa `portafolio.tudominio.com` en las variables de Ansible.
3. Si tu dominio ya tiene un registro AAAA para ese mismo nombre, comprueba que apunte a un origen IPv6 válido o retíralo si era de una configuración previa de este subdominio.

## 4. Configurar Ubuntu con Ansible

Ejecuta Ansible desde Linux o WSL, en la raíz del repositorio. Por ejemplo, en Ubuntu bajo WSL instala `ansible-core` con `pipx`. La tarea de repositorio Docker requiere Ansible Core 2.15 o posterior. Copia tu clave privada a `~/.ssh/mj-portfolio` en el sistema desde el que ejecutarás Ansible y aplica `chmod 600 ~/.ssh/mj-portfolio`.

```bash
cd infra/ansible
cp inventory.example.ini inventory.ini
cp vars.example.yml vars.yml
```

Completa `inventory.ini` con la IP de Terraform. En `vars.yml` escribe tu mismo CIDR, el nombre completo de Cloudflare y el nombre del repositorio de Docker Hub. Activa `enable_vnc: true` si necesitas escritorio.

```bash
ssh -i ~/.ssh/mj-portfolio ubuntu@IP_PUBLICA
# En la VM, comprueba que el arranque inicial terminó y luego sal:
sudo cloud-init status --wait
exit

ansible-playbook -i inventory.ini site.yml -e @vars.yml --syntax-check
ansible-playbook -i inventory.ini site.yml -e @vars.yml
ssh -i ~/.ssh/mj-portfolio ubuntu@IP_PUBLICA
sudo /usr/local/sbin/mj-portfolio-deploy latest
curl --fail http://127.0.0.1:3000/api/health
sudo ufw status verbose
sudo iptables -S
exit
```

Verifica el certificado con `curl --fail https://portafolio.tudominio.com/api/health`. Si funciona, en Cloudflare selecciona **SSL/TLS → Full (strict)** y activa el proxy en el registro A si deseas que el tráfico pase por Cloudflare. Vuelve a comprobar la URL. Si HTTPS falla, consulta `sudo journalctl -u caddy -n 60 --no-pager` en la VM. [Requisitos de Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/).

### Escritorio VNC por SSH

Con `enable_vnc: true` en Ansible, conéctate a la VM como `ubuntu` y crea la contraseña de VNC cuando se te solicite. Inicia XFCE en la pantalla `:1`.

```bash
tigervncserver :1 -localhost yes -xstartup /usr/bin/startxfce4
```

En otra terminal de tu equipo abre el túnel, mantenlo activo y conecta tu cliente VNC a `127.0.0.1:5901`.

```bash
ssh -i ~/.ssh/mj-portfolio -N -L 5901:127.0.0.1:5901 ubuntu@IP_PUBLICA
```

El puerto 5901 vive en loopback de la VM. Para cerrar el escritorio ejecuta `tigervncserver -kill :1` dentro de la VM. Cierra la terminal del túnel cuando termines.

## 5. Activar despliegues automáticos

1. En **AWS Systems Manager → Fleet Manager**, comprueba que la instancia aparece en línea. Para la interpolación de parámetros, se necesita SSM Agent 3.3.2746.0 o posterior. En la VM revisa `snap list amazon-ssm-agent` y actualízalo con `sudo snap refresh amazon-ssm-agent` si hace falta. [Requisitos del agente](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-troubleshooting.html).
2. En **GitHub → Settings → Secrets and variables → Actions → Variables**, registra las salidas de Terraform.

| Variable de GitHub | Salida de Terraform |
| --- | --- |
| `AWS_DEPLOY_ROLE_ARN` | `github_deploy_role_arn` |
| `AWS_INSTANCE_ID` | `instance_id` |
| `AWS_REGION` | `region` |

3. En **Actions → Publicar y desplegar**, ejecútalo manualmente sobre `main` para comprobar la integración. Luego revisa el resultado del próximo push. El workflow asume por OIDC un rol limitado al repositorio, rama, documento SSM e instancia configurados. Las credenciales estáticas de AWS no hacen falta en GitHub.
4. Comprueba `https://portafolio.tudominio.com/api/health` y abre un detalle de proyecto. En la VM, `sudo docker compose --project-directory /opt/mj ps` muestra el contenedor activo. El script puede recuperar la versión anterior cuando la nueva no supera su comprobación de salud.

Si dejas de usar la infraestructura, revisa `terraform plan -destroy` y ejecuta `terraform destroy` cuando estés lista para eliminarla. Esto borra la VM, su disco y el volumen SQLite de esa VM. Retira el registro DNS correspondiente en Cloudflare.
