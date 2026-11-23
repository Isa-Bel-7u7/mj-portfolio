# Despliegue del portafolio MJ

## Desplegar en Oracle Cloud

Cada push a `main` ejecuta las pruebas, publica la imagen en Docker Hub y ejecuta Terraform y Ansible desde un runner Linux de GitHub Actions con la etiqueta `portfolio-oci`. Ansible instala VNC y despliega el digest generado por ese mismo workflow. El último paso consulta `/api/health` por HTTPS.

### Preparar el entorno `production` de GitHub Actions

Registra un runner Linux dedicado a este repositorio con la etiqueta `portfolio-oci`, Terraform, `jq`, `curl`, OpenSSH y `ansible-core` 2.15 o posterior. Su usuario necesita credenciales OCI para el stack y acceso SSH verificado como `ubuntu`. Configura la clave privada en el usuario del runner y registra en `known_hosts` la clave pública de host comprobada en la consola de esa VM. La IP de salida del runner debe estar permitida para SSH en OCI y UFW.

| Tipo | Nombre | Valor |
| --- | --- | --- |
| Variable | `OCI_STATE_PATH` | Ruta absoluta y persistente al estado de Terraform del stack OCI, fuera del checkout. |
| Variable | `OCI_VM_HOST` | IP pública o nombre DNS directo de la VM para SSH. |
| Variable | `PORTFOLIO_ADMIN_CIDR` | IPv4 de salida autorizada en UFW, con `/32`. |
| Variable | `PORTFOLIO_DOMAIN` | Nombre público de Cloudflare que sirve el portafolio por HTTPS. |
| Secreto | `PORTFOLIO_VNC_PASSWORD` | Contraseña de ocho caracteres ASCII imprimibles sin espacios. |

Configura las credenciales de Docker Hub a nivel del repositorio para el job de publicación. Si el estado actual está en OCI Resource Manager, conserva una copia, verifica que las direcciones de recursos coincidan con el código y migra el estado al runner antes del primer despliegue. A partir de la migración, usa ese estado para aplicar cambios. El job requiere que el estado ya incluya la VM y detiene planes que eliminan o reemplazan recursos.

GitHub Actions publica la imagen de cada push a `main` en Docker Hub. En la VM existente, Ansible instala un temporizador de systemd que consulta `latest` cada cinco minutos. Si cambia el digest, el script aplica la imagen y registra el resultado. Si la imagen falla y existe un digest anterior, lo restaura.

1. Usa la IP pública de `mj-portafolio-vm` en el inventario de Ansible y en el registro A de Cloudflare.
2. Configura `portfolio_domain`, `admin_cidr` y `portfolio_repository` en `vars.yml`. El repositorio de Docker Hub debe ser público. Para VNC, activa `enable_vnc: true`.
3. Desde Linux o WSL ejecuta el playbook de la sección 4. El temporizador queda habilitado también después de reiniciar la VM.
4. Para probar de inmediato desde la VM, ejecuta los siguientes comandos.

```bash
sudo systemctl start mj-portfolio-update.service
sudo journalctl -u mj-portfolio-update.service -n 40 --no-pager
systemctl list-timers mj-portfolio-update.timer
curl --fail http://127.0.0.1:3000/api/health
```

Comprueba también `https://TU_DOMINIO/api/health`. GitHub registra la publicación de la imagen. El diario de systemd registra su aplicación en la VM.

Las secciones de AWS describen el aprovisionamiento anterior. Para la infraestructura de Oracle, consulta `infra/terraform-oci-stack` si dispones de la exportación del stack.

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

Cuando pasan las pruebas unitarias, de integración y de navegador en `main`, GitHub publica `TU_USUARIO_DOCKERHUB/mj-portfolio:latest` y una etiqueta con el SHA del commit. La VM de OCI aplica la imagen cuando está habilitado el temporizador.

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

Completa `inventory.ini` con la IP pública de la VM de OCI. Ajusta `ansible_ssh_private_key_file` para que apunte a la clave privada que corresponde a esa VM. En `vars.yml` escribe tu mismo CIDR, el nombre completo de Cloudflare y el nombre del repositorio de Docker Hub. Activa `enable_vnc: true` si necesitas escritorio.

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

Con `enable_vnc: true`, Ansible instala y habilita `mj-portfolio-vnc.service`, que inicia XFCE en la pantalla `:1`. Para ejecuciones manuales del playbook, proporciona `PORTFOLIO_VNC_PASSWORD` en el entorno del controlador antes de ejecutarlo. Puedes comprobar el servicio mediante `systemctl status mj-portfolio-vnc.service` en la VM.

En otra terminal de tu equipo abre el túnel, mantenlo activo y conecta tu cliente VNC a `127.0.0.1:5901`.

```bash
ssh -i ~/.ssh/mj-portfolio -N -L 5901:127.0.0.1:5901 ubuntu@IP_PUBLICA
```

El puerto 5901 vive en loopback de la VM. Conéctate con la contraseña de VNC configurada. Cierra la terminal del túnel al terminar.

## 5. Verificar un despliegue automático en OCI

1. En **GitHub Actions**, abre **Publicar y desplegar** y ejecútalo sobre `main`, o revisa la ejecución del último push. El job de publicación debe terminar correctamente y Docker Hub debe mostrar las etiquetas `latest` y la del SHA.
2. En la VM, revisa el temporizador y el diario con los comandos de la sección de Oracle Cloud. Para inspeccionar el contenedor activo, ejecuta `sudo docker compose --project-directory /opt/mj ps`.
3. Abre `https://TU_DOMINIO/api/health` y un detalle de proyecto para comprobar el acceso público.

### Retirar la infraestructura de AWS

Si dejas de usar la infraestructura, revisa `terraform plan -destroy` y ejecuta `terraform destroy` cuando estés lista para eliminarla. Esto borra la VM, su disco y el volumen SQLite de esa VM. Retira el registro DNS correspondiente en Cloudflare.
