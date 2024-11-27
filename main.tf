# AWS Docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs

# Steps:
# 0. Select a provider                                                          https://registry.terraform.io/providers/hashicorp/aws/latest
# 1. Create an EC2 instance                                                     https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/instance
# 2. Create Elastic IP and assign                                               https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/eip
# 3. Create a security group to open ports                                      https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/security_group
# optional. Define output to display after apply                                https://developer.hashicorp.com/terraform/language/values/outputs

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# 1. Create a new EC2 instance

resource "aws_instance" "my_instance" {
  ami           = "ami-0e2c8caa4b6378d8c"
  instance_type = "t2.micro"
  key_name      = "grpo14arquisis" # POSIBLE FUENTE DE ERROR
  vpc_security_group_ids = [aws_security_group.my_security_group.id]
  user_data = "${file("./scriptsCI/deployment.sh")}"
  tags = {
    Name = "instancia-ec2-grupo14"
  }
}

# 2. Create and assign Elastic IP
resource "aws_eip" "my_eip" {
  instance = aws_instance.my_instance.id
}

# 3. Create a security group to open ports
resource "aws_security_group" "my_security_group" {
  name        = "my-security-group1"
  description = "Security group for SSH access"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

# Output to dislay after `terraform apply`
output "elastic_ip" {
  value = aws_eip.my_eip.public_ip
}

output "ssh_command" {
  value = "ssh -i ${aws_instance.my_instance.key_name}.pem ubuntu@${aws_eip.my_eip.public_ip}"
}