output "public_ip" {
  value = aws_eip.portfolio.public_ip
}

output "instance_id" {
  value = aws_instance.portfolio.id
}

output "region" {
  value = var.region
}

output "github_deploy_role_arn" {
  value = try(aws_iam_role.github[0].arn, null)
}
