FROM node:latest

# Install additional dependencies if needed
RUN apt-get update && apt-get install -y \
    git \
	sudo \
    && rm -rf /var/lib/apt/lists/*

#Add node user to sudo group
RUN usermod -aG sudo node \
    && echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Set working directory and ensure node user owns it
#WORKDIR /workspace
#RUN chown -R node:node /workspace

# Switch to node user
USER node