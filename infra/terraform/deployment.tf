resource "aws_iam_openid_connect_provider" "github" {
  count          = var.github_repository != "" && var.github_oidc_provider_arn == "" ? 1 : 0
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

resource "aws_ssm_document" "deployment" {
  name            = "mj-portfolio-deploy"
  document_type   = "Command"
  document_format = "JSON"
  content = jsonencode({
    schemaVersion = "2.2"
    description   = "Despliega una imagen inmutable del portafolio MJ."
    parameters = {
      Digest = {
        type              = "String"
        allowedPattern    = "^sha256:[a-f0-9]{64}$"
        interpolationType = "ENV_VAR"
      }
    }
    mainSteps = [{
      name   = "Deploy"
      action = "aws:runShellScript"
      inputs = {
        timeoutSeconds = "240"
        runCommand     = ["/usr/local/sbin/mj-portfolio-deploy \"$SSM_Digest\""]
      }
    }]
  })
}

resource "aws_iam_role" "github" {
  count       = var.github_repository != "" ? 1 : 0
  name_prefix = "mj-portfolio-github-"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRoleWithWebIdentity"
      Principal = {
        Federated = var.github_oidc_provider_arn != "" ? var.github_oidc_provider_arn : aws_iam_openid_connect_provider.github[0].arn
      }
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repository}:ref:refs/heads/main"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "github" {
  count = var.github_repository != "" ? 1 : 0
  role  = aws_iam_role.github[0].name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "ssm:SendCommand"
        Resource = [aws_instance.portfolio.arn, aws_ssm_document.deployment.arn]
      },
      {
        Effect   = "Allow"
        Action   = "ssm:GetCommandInvocation"
        Resource = "*"
      }
    ]
  })
}
