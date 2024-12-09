#!/bin/bash

# Update the system
sudo apt update -y
sudo apt upgrade -y

# Install Docker APT Repository
sudo apt install ca-certificates curl gnupg -y
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
"deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
"$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update -y
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

# Install NGINX
sudo apt install nginx -y

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Start and enable NGINX
sudo systemctl start nginx
sudo systemctl enable nginx

# Print the status of Docker and NGINX
sudo systemctl status docker
sudo systemctl status nginx