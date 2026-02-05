# Installing Docker

This guide covers Docker installation on different operating systems.

## System Requirements

### Minimum Requirements

- 64-bit processor
- 4 GB RAM (8 GB recommended)
- Virtualization enabled in BIOS (for Windows/macOS)

---

## Installation by Platform

=== "Windows"

    ### Docker Desktop for Windows

    1. **Download Docker Desktop**

       Visit [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) and download the installer.

    2. **Run the Installer**

       Double-click `Docker Desktop Installer.exe` and follow the prompts.

    3. **Enable WSL 2 Backend** (Recommended)

       During installation, ensure "Use WSL 2 instead of Hyper-V" is selected.

    4. **Start Docker Desktop**

       Launch Docker Desktop from the Start menu.

    5. **Verify Installation**

       Open PowerShell and run:
       ```powershell
       docker --version
       docker run hello-world
       ```

    !!! note "WSL 2 Requirement"
        Windows 10 version 2004 or higher is required for WSL 2.

=== "macOS"

    ### Docker Desktop for macOS

    1. **Download Docker Desktop**

       Visit [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/) and download the appropriate version:

       - **Apple Silicon (M1/M2)**: Download the Apple Silicon version
       - **Intel**: Download the Intel version

    2. **Install the Application**

       Drag `Docker.app` to your Applications folder.

    3. **Start Docker Desktop**

       Open Docker from Applications.

    4. **Verify Installation**

       Open Terminal and run:
       ```bash
       docker --version
       docker run hello-world
       ```

=== "Linux (Ubuntu/Debian)"

    ### Install Docker Engine

    1. **Update Package Index**
       ```bash
       sudo apt-get update
       ```

    2. **Install Prerequisites**
       ```bash
       sudo apt-get install ca-certificates curl gnupg
       ```

    3. **Add Docker's Official GPG Key**
       ```bash
       sudo install -m 0755 -d /etc/apt/keyrings
       curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
       sudo chmod a+r /etc/apt/keyrings/docker.gpg
       ```

    4. **Set Up the Repository**
       ```bash
       echo \
         "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
         $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
         sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
       ```

    5. **Install Docker Engine**
       ```bash
       sudo apt-get update
       sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
       ```

    6. **Add Your User to the Docker Group** (Optional)
       ```bash
       sudo usermod -aG docker $USER
       newgrp docker
       ```

    7. **Verify Installation**
       ```bash
       docker --version
       docker run hello-world
       ```

=== "Linux (RHEL/CentOS)"

    ### Install Docker Engine

    1. **Remove Old Versions**
       ```bash
       sudo yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine
       ```

    2. **Install Prerequisites**
       ```bash
       sudo yum install -y yum-utils
       ```

    3. **Set Up the Repository**
       ```bash
       sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
       ```

    4. **Install Docker Engine**
       ```bash
       sudo yum install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
       ```

    5. **Start Docker**
       ```bash
       sudo systemctl start docker
       sudo systemctl enable docker
       ```

    6. **Verify Installation**
       ```bash
       docker --version
       sudo docker run hello-world
       ```

---

## Post-Installation Steps

### Running Docker Without Sudo (Linux)

By default, Docker requires root privileges. To run Docker as a non-root user:

```bash
# Create the docker group
sudo groupadd docker

# Add your user to the docker group
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker

# Verify it works without sudo
docker run hello-world
```

### Configure Docker to Start on Boot

=== "systemd (Most Linux)"

    ```bash
    sudo systemctl enable docker.service
    sudo systemctl enable containerd.service
    ```

=== "Docker Desktop"

    Docker Desktop starts automatically by default. You can change this in Settings > General.

---

## Verifying Your Installation

Run these commands to verify Docker is working correctly:

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker compose version

# Run test container
docker run hello-world

# Check Docker system info
docker info
```

## Troubleshooting

!!! warning "Common Issues"

    **Docker daemon not running**
    ```bash
    # Linux
    sudo systemctl start docker

    # macOS/Windows
    # Start Docker Desktop application
    ```

    **Permission denied**
    ```bash
    # Add user to docker group (Linux)
    sudo usermod -aG docker $USER
    # Then log out and back in
    ```

    **WSL 2 not installed (Windows)**
    ```powershell
    wsl --install
    # Restart your computer
    ```

## Next Steps

Now that Docker is installed, proceed to [Your First Container](first-container.md) to run your first containerized application.
